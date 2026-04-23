import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [TasksService, PrismaService],
  exports: [TasksService],
})
export class TasksModule {}
