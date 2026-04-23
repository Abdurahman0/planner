import { Injectable } from '@nestjs/common';
import { AIPlanRequest, AIPlanResponse } from '@packages/shared';

export interface IAIService {
  generatePlan(request: AIPlanRequest): Promise<AIPlanResponse>;
  replan(currentPlan: any, progress: any): Promise<AIPlanResponse>;
}

@Injectable()
export class AiService implements IAIService {
  async generatePlan(request: AIPlanRequest): Promise<AIPlanResponse> {
    // Placeholder for OpenAI/Gemini integration
    // AI should return structured JSON
    return {
      tasks: [],
      milestones: [],
    };
  }

  async replan(currentPlan: any, progress: any): Promise<AIPlanResponse> {
    return {
      tasks: [],
      milestones: [],
    };
  }
}
