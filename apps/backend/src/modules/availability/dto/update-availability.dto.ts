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
  ValidateIf,
} from 'class-validator';
import { AvailabilityType } from '@prisma/client';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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
}
