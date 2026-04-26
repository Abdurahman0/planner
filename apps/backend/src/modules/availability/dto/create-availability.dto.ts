import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { AvailabilityType } from '@prisma/client';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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
}
