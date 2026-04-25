import {
  BadGatewayException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AiActionType,
  GoalPriority,
  GoalType,
  Prisma,
  SubscriptionPlan,
  TaskSource,
  TaskType,
} from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { getAiApiKey, getAiModel } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user';
import { GoalsService } from '../goals/goals.service';
import { CreateGoalDto } from '../goals/dto/create-goal.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { TasksService } from '../tasks/tasks.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ReplanDto } from './dto/replan.dto';

const generatedTaskSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(['time_based', 'unit_based']),
  plannedDate: z.string().datetime(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  estimatedMinutes: z.number().int().min(1).max(1440).optional(),
  targetValue: z.number().positive().max(100000).optional(),
  targetUnit: z.string().trim().min(1).max(50).optional(),
});

const generatedPlanSchema = z.object({
  tasks: z.array(generatedTaskSchema).min(3).max(12),
});

type GeneratedTask = z.infer<typeof generatedTaskSchema>;

@Injectable()
export class AiService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GoalsService) private readonly goalsService: GoalsService,
    @Inject(TasksService) private readonly tasksService: TasksService,
  ) {}

  async generatePlan(user: AuthUser, dto: GeneratePlanDto) {
    const actionType = AiActionType.initial_plan;
    const model = getAiModel();
    const subscriptionPlan = await this.resolveCurrentSubscriptionPlan(user.id, user.subscriptionPlan);

    this.assertCanUseAi(subscriptionPlan);
    await this.assertAiQuota(user.id, subscriptionPlan);

    const targetDate = new Date(dto.targetDate);
    this.assertFutureTargetDate(targetDate);

    let usageMetadata: UsageMetadata | null = null;

    try {
      const generatedTasks = await this.generateTasksWithModel({
        actionType,
        model,
        title: dto.title,
        description: dto.description,
        targetDate,
        availability: dto.availability ?? [],
      });

      usageMetadata = generatedTasks.usageMetadata;

      const { goal, tasks } = await this.prisma.$transaction(async (tx) => {
        const createdGoal = await this.goalsService.create(
          user.id,
          {
            title: dto.title,
            description: dto.description,
            targetDate: dto.targetDate,
            priority: dto.priority ?? GoalPriority.medium,
            type: GoalType.ai_managed,
          } satisfies CreateGoalDto,
          subscriptionPlan,
          tx,
        );

        const createdTasks = [];

        for (const generatedTask of generatedTasks.tasks) {
          createdTasks.push(
            await this.tasksService.create(
              user.id,
              this.toCreateTaskDto(createdGoal.id, generatedTask),
              TaskSource.ai,
              tx,
            ),
          );
        }

        await this.tasksService.recalculateGoalProjectedDate(user.id, createdGoal.id, tx);

        return {
          goal: createdGoal,
          tasks: createdTasks,
        };
      });

      await this.logAiUsage({
        userId: user.id,
        goalId: goal.id,
        actionType,
        model,
        usageMetadata,
        success: true,
      });

      return {
        goal,
        tasks,
        model,
      };
    } catch (error) {
      await this.logAiUsage({
        userId: user.id,
        actionType,
        model,
        usageMetadata,
        success: false,
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  }

  async replan(user: AuthUser, dto: ReplanDto) {
    const actionType = AiActionType.replan;
    const model = getAiModel();
    const subscriptionPlan = await this.resolveCurrentSubscriptionPlan(user.id, user.subscriptionPlan);

    this.assertCanUseAi(subscriptionPlan);
    await this.assertAiQuota(user.id, subscriptionPlan);

    const goal = await this.prisma.goal.findFirst({
      where: {
        id: dto.goalId,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        targetDate: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
            plannedDate: true,
            estimatedMinutes: true,
            targetValue: true,
            completedValue: true,
            targetUnit: true,
            source: true,
            progressLogs: {
              select: {
                status: true,
                completionPercent: true,
                completedValue: true,
                loggedAt: true,
              },
            },
          },
          orderBy: [
            { plannedDate: 'asc' },
            { order: 'asc' },
          ],
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.type !== GoalType.ai_managed) {
      throw new ForbiddenException('Replan is only available for AI-managed goals');
    }

    let usageMetadata: UsageMetadata | null = null;

    try {
      const generatedTasks = await this.generateTasksWithModel({
        actionType,
        model,
        title: goal.title,
        description: goal.description ?? undefined,
        targetDate: goal.targetDate,
        availability: [],
        existingTasks: goal.tasks,
        currentProgress: dto.currentProgress,
      });

      usageMetadata = generatedTasks.usageMetadata;

      const tasks = await this.prisma.$transaction(async (tx) => {
        await this.tasksService.deleteOpenAiTasksForGoal(user.id, goal.id, tx);

        const createdTasks = [];

        for (const generatedTask of generatedTasks.tasks) {
          createdTasks.push(
            await this.tasksService.create(
              user.id,
              this.toCreateTaskDto(goal.id, generatedTask),
              TaskSource.ai,
              tx,
            ),
          );
        }

        await this.tasksService.recalculateGoalProjectedDate(user.id, goal.id, tx);

        return createdTasks;
      });

      await this.logAiUsage({
        userId: user.id,
        goalId: goal.id,
        actionType,
        model,
        usageMetadata,
        success: true,
      });

      return {
        goalId: goal.id,
        tasks,
        model,
      };
    } catch (error) {
      await this.logAiUsage({
        userId: user.id,
        goalId: goal.id,
        actionType,
        model,
        usageMetadata,
        success: false,
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  }

  private async generateTasksWithModel(input: GeneratePromptInput) {
    const apiKey = this.resolveAiApiKey();
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: input.model,
      contents: this.buildPrompt(input),
      config: {
        responseMimeType: 'application/json',
        responseSchema: taskPlanResponseSchema,
        temperature: 0.2,
      },
    });

    const rawJson = response.text?.trim();

    if (!rawJson) {
      throw new BadGatewayException('AI returned an empty response');
    }

    const parsed = this.parseAndValidateResponse(rawJson, input.targetDate);

    return {
      tasks: parsed.tasks,
      usageMetadata: {
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      },
    };
  }

  private parseAndValidateResponse(rawJson: string, targetDate: Date) {
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      throw new BadGatewayException('AI returned invalid JSON');
    }

    const result = generatedPlanSchema.safeParse(parsedJson);

    if (!result.success) {
      throw new BadGatewayException('AI returned invalid task schema');
    }

    const normalizedTasks = result.data.tasks.map((task) => this.normalizeGeneratedTask(task, targetDate));

    if (normalizedTasks.length === 0) {
      throw new BadGatewayException('AI returned no tasks');
    }

    return {
      tasks: normalizedTasks,
    };
  }

  private normalizeGeneratedTask(task: GeneratedTask, targetDate: Date) {
    const plannedDate = new Date(task.plannedDate);
    const today = startOfUtcDay(new Date());
    const targetDay = endOfUtcDay(targetDate);

    if (Number.isNaN(plannedDate.getTime())) {
      throw new BadGatewayException('AI returned an invalid plannedDate');
    }

    if (plannedDate.getTime() < today.getTime()) {
      throw new BadGatewayException('AI returned a task scheduled in the past');
    }

    if (plannedDate.getTime() > targetDay.getTime()) {
      throw new BadGatewayException('AI returned a task scheduled after the target date');
    }

    if ((task.startTime && !task.endTime) || (!task.startTime && task.endTime)) {
      throw new BadGatewayException('AI returned mismatched start/end times');
    }

    if (task.startTime && task.endTime && task.startTime >= task.endTime) {
      throw new BadGatewayException('AI returned an invalid time range');
    }

    if (task.type === TaskType.time_based && !task.estimatedMinutes) {
      throw new BadGatewayException('AI time-based tasks require estimatedMinutes');
    }

    if (task.type === TaskType.unit_based && (!task.targetValue || !task.targetUnit)) {
      throw new BadGatewayException('AI unit-based tasks require targetValue and targetUnit');
    }

    return task;
  }

  private buildPrompt(input: GeneratePromptInput) {
    const lines = [
      'Return JSON only.',
      'Generate a structured planner task list.',
      'Never include explanations, markdown, comments, or extra keys.',
      'Use between 3 and 12 tasks.',
      'Schedule tasks on or after today and on or before the target date.',
      'Use time_based tasks when duration is the main measure.',
      'Use unit_based tasks only when the work is naturally countable.',
      `Goal title: ${input.title}`,
      `Goal description: ${input.description ?? 'None'}`,
      `Target date: ${input.targetDate.toISOString()}`,
    ];

    if (input.availability.length > 0) {
      lines.push('Weekly availability:');
      for (const slot of input.availability) {
        lines.push(
          `- day ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime} (${slot.type})`,
        );
      }
    } else {
      lines.push('No availability was provided. Use a reasonable daily workload.');
    }

    if (input.actionType === AiActionType.replan) {
      lines.push('This is a replan request.');
      lines.push('Keep completed work intact and create replacement future tasks only.');

      if (input.existingTasks && input.existingTasks.length > 0) {
        lines.push('Current tasks and progress:');
        for (const task of input.existingTasks) {
          const latestPercent =
            task.progressLogs.reduce((maxPercent, log) => Math.max(maxPercent, log.completionPercent ?? 0), 0);
          const latestValue =
            task.progressLogs.reduce((maxValue, log) => Math.max(maxValue, log.completedValue ?? 0), 0);
          const completedValueText = task.completedValue ?? latestValue ?? 'n/a';
          const completionPercentText = latestPercent > 0 ? latestPercent : 'n/a';

          lines.push(
            `- ${task.title} | status=${task.status} | type=${task.type} | plannedDate=${task.plannedDate.toISOString()} | estimatedMinutes=${task.estimatedMinutes ?? 'n/a'} | targetValue=${task.targetValue ?? 'n/a'} | completedValue=${completedValueText} | completionPercent=${completionPercentText}`,
          );
        }
      }

      if (input.currentProgress) {
        lines.push(`User progress note: ${input.currentProgress}`);
      }
    }

    return lines.join('\n');
  }

  private toCreateTaskDto(goalId: string, task: GeneratedTask): CreateTaskDto {
    return {
      goalId,
      title: task.title,
      description: task.description,
      type: task.type as TaskType,
      plannedDate: task.plannedDate,
      startTime: task.startTime,
      endTime: task.endTime,
      estimatedMinutes: task.estimatedMinutes,
      targetValue: task.targetValue,
      targetUnit: task.targetUnit,
    };
  }

  private async resolveCurrentSubscriptionPlan(userId: string, fallbackPlan: SubscriptionPlan) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.subscriptionPlan ?? fallbackPlan;
  }

  private assertCanUseAi(subscriptionPlan: SubscriptionPlan) {
    if (subscriptionPlan === SubscriptionPlan.free) {
      throw new ForbiddenException('AI planning requires a premium subscription');
    }
  }

  private assertFutureTargetDate(targetDate: Date) {
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadGatewayException('Invalid target date');
    }

    const today = startOfUtcDay(new Date());
    const targetDay = startOfUtcDay(targetDate);

    if (targetDay.getTime() < today.getTime()) {
      throw new BadGatewayException('Target date must be today or later');
    }
  }

  private async assertAiQuota(userId: string, subscriptionPlan: SubscriptionPlan) {
    const startOfDay = startOfUtcDay(new Date());
    const dailyUsageCount = await this.prisma.aiUsageLog.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    const dailyLimit = dailyAiLimits[subscriptionPlan];

    if (dailyUsageCount >= dailyLimit) {
      throw new ForbiddenException('Daily AI planning limit reached');
    }
  }

  private async logAiUsage(input: {
    userId: string;
    goalId?: string;
    actionType: AiActionType;
    model: string;
    usageMetadata: UsageMetadata | null;
    success: boolean;
    errorMessage?: string;
  }) {
    await this.prisma.aiUsageLog.create({
      data: {
        userId: input.userId,
        goalId: input.goalId,
        actionType: input.actionType,
        model: input.model,
        inputTokens: input.usageMetadata?.inputTokens,
        outputTokens: input.usageMetadata?.outputTokens,
        success: input.success,
        errorMessage: input.errorMessage,
      },
    });
  }

  private resolveAiApiKey() {
    try {
      return getAiApiKey();
    } catch {
      throw new ServiceUnavailableException('AI provider is not configured');
    }
  }
}

const taskPlanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['time_based', 'unit_based'] },
          plannedDate: { type: Type.STRING },
          startTime: { type: Type.STRING },
          endTime: { type: Type.STRING },
          estimatedMinutes: { type: Type.INTEGER },
          targetValue: { type: Type.NUMBER },
          targetUnit: { type: Type.STRING },
        },
        required: ['title', 'type', 'plannedDate'],
      },
    },
  },
  required: ['tasks'],
} as const;

const dailyAiLimits: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.free]: 0,
  [SubscriptionPlan.ai_basic]: 20,
  [SubscriptionPlan.ai_pro]: 100,
};

interface UsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
}

interface GeneratePromptInput {
  actionType: AiActionType;
  model: string;
  title: string;
  description?: string;
  targetDate: Date;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    type: string;
  }>;
  existingTasks?: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    plannedDate: Date;
    estimatedMinutes: number | null;
    targetValue: number | null;
    completedValue: number | null;
    targetUnit: string | null;
    source: string;
    progressLogs: Array<{
      status: string;
      completionPercent: number | null;
      completedValue: number | null;
      loggedAt: Date;
    }>;
  }>;
  currentProgress?: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown AI error';
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}
