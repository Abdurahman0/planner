import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
