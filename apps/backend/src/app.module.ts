import { Module } from '@nestjs/common';
import { GoalsModule } from './modules/goals/goals.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AiModule } from './modules/ai/ai.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    UsersModule,
    GoalsModule,
    TasksModule,
    AiModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
