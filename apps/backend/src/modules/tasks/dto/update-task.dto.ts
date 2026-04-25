import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { TaskType } from '@prisma/client';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateTaskDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  plannedDate?: string;

  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(TIME_PATTERN)
  startTime?: string | null;

  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @Matches(TIME_PATTERN)
  endTime?: string | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  targetValue?: number | null;

  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(1, 50)
  targetUnit?: string | null;
}
