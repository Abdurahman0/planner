import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { AvailabilityType } from '@prisma/client';
import { RecurrenceType } from '@packages/shared';

const TIME_PATTERN = /^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/;

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

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
  @IsEnum(AvailabilityType)
  type?: AvailabilityType;

  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(1, 80)
  label?: string | null;

  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601({ strict: true, strictSeparator: true })
  startDate?: string | null;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  recurrenceDaysOfWeek?: number[];

  @Transform(({ value }) => {
    if (value === null) {
      return null;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsISO8601({ strict: true, strictSeparator: true })
  recurrenceEndDate?: string | null;
}
