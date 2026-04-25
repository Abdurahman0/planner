import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AvailabilityType, GoalPriority } from '@prisma/client';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class GeneratePlanAvailabilityDto {
  @IsInt()
  @Min(0)
  dayOfWeek!: number;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(TIME_PATTERN)
  startTime!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(TIME_PATTERN)
  endTime!: string;

  @IsEnum(AvailabilityType)
  type!: AvailabilityType;
}

export class GeneratePlanDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 160)
  title!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  targetDate!: string;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratePlanAvailabilityDto)
  availability?: GeneratePlanAvailabilityDto[];
}
