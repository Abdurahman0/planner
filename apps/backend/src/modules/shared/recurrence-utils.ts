import { BadRequestException } from '@nestjs/common';
import { RecurrenceLike, RecurrenceType } from '@packages/shared';

export const RECURRENCE_RANGE_LIMIT_DAYS = 400;

export function assertValidRecurrenceInput(
  recurrenceType: RecurrenceLike | undefined,
  recurrenceDaysOfWeek: number[] | undefined,
  startDate: Date,
  endDate?: Date,
) {
  if (endDate && normalizeDate(endDate).getTime() < normalizeDate(startDate).getTime()) {
    throw new BadRequestException('recurrenceEndDate must be on or after the start date');
  }

  if ((recurrenceType ?? RecurrenceType.NONE) !== RecurrenceType.WEEKLY && recurrenceDaysOfWeek?.length) {
    throw new BadRequestException('recurrenceDaysOfWeek is only allowed for weekly recurrence');
  }

  if ((recurrenceType ?? RecurrenceType.NONE) === RecurrenceType.WEEKLY && recurrenceDaysOfWeek?.length) {
    const invalidDay = recurrenceDaysOfWeek.some((day) => day < 0 || day > 6);

    if (invalidDay) {
      throw new BadRequestException('recurrenceDaysOfWeek must contain values between 0 and 6');
    }
  }
}

export function assertValidOccurrenceRange(from?: string, to?: string) {
  if (!from || !to) {
    return;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new BadRequestException('from and to must be valid ISO dates');
  }

  if (toDate.getTime() < fromDate.getTime()) {
    throw new BadRequestException('to must be on or after from');
  }

  const diffInDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));

  if (diffInDays > RECURRENCE_RANGE_LIMIT_DAYS) {
    throw new BadRequestException(`recurrence range cannot exceed ${RECURRENCE_RANGE_LIMIT_DAYS} days`);
  }
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
