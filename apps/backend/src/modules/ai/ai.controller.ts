import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { AiService } from './ai.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ReplanDto } from './dto/replan.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(@Inject(AiService) private readonly aiService: AiService) {}

  @Post('generate-plan')
  generatePlan(@CurrentUser() user: AuthUser, @Body() dto: GeneratePlanDto) {
    return this.aiService.generatePlan(user, dto);
  }

  @Post('replan')
  replan(@CurrentUser() user: AuthUser, @Body() dto: ReplanDto) {
    return this.aiService.replan(user, dto);
  }
}
