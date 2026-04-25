import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { GoalPriority, GoalType } from '@prisma/client';

export class CreateGoalDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(GoalType)
  type!: GoalType;

  @IsDateString()
  targetDate!: string;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;
}
