import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TaskType } from '@prisma/client';
import { RecurrenceType } from '@packages/shared';

const TIME_PATTERN = /^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/;

export class CreateTaskDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsUUID()
  goalId?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 200)
  title!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(TaskType)
  type!: TaskType;

  @IsISO8601({ strict: true, strictSeparator: true })
  plannedDate!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @Matches(TIME_PATTERN)
  startTime?: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @Matches(TIME_PATTERN)
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  targetValue?: number;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 50)
  targetUnit?: string;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  recurrenceDaysOfWeek?: number[];

  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  recurrenceEndDate?: string;
}
