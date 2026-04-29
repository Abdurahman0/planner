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
} from 'class-validator';
import { AvailabilityType } from '@prisma/client';
import { RecurrenceType } from '@packages/shared';

const TIME_PATTERN = /^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/;

export class CreateAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(TIME_PATTERN)
  startTime!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Matches(TIME_PATTERN)
  endTime!: string;

  @IsEnum(AvailabilityType)
  type!: AvailabilityType;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return typeof value === 'string' ? value.trim() : value;
  })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  label?: string;

  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  startDate?: string;

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
