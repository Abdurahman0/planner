import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [GoalsService, PrismaService],
  exports: [GoalsService],
})
export class GoalsModule {}
