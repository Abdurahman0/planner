import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { AIPlanRequest } from '@packages/shared';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-plan')
  async generatePlan(@Request() req, @Body() body: AIPlanRequest) {
    // Check subscription plan in real app
    return this.aiService.generatePlan(body);
  }

  @Post('replan')
  async replan(@Request() req, @Body() body: any) {
    return this.aiService.replan(body.currentPlan, body.progress);
  }
}
