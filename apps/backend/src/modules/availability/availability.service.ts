import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RecurrenceLike,
  AvailabilityType,
  RecurrenceType,
  expandAvailabilityForRange,
  startOfDay,
} from '@packages/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { assertValidRecurrenceInput } from '../shared/recurrence-utils';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAvailabilityDto) {
    this.assertValidTimeRange(dto.startTime, dto.endTime);
    const startDate = dto.startDate ? new Date(dto.startDate) : startOfDay(new Date());
    const recurrenceType = dto.recurrenceType ?? RecurrenceType.WEEKLY;
    const recurrenceDaysOfWeek = recurrenceType === RecurrenceType.WEEKLY
      ? (dto.recurrenceDaysOfWeek?.length ? dto.recurrenceDaysOfWeek : [dto.dayOfWeek])
      : [];
    assertValidRecurrenceInput(recurrenceType, recurrenceDaysOfWeek, startDate, dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined);
    await this.assertNoOverlap(userId, {
      dayOfWeek: dto.dayOfWeek,
      startDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      recurrenceType,
      recurrenceDaysOfWeek,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
    });

    return this.prisma.availabilitySlot.create({
      data: {
        userId,
        dayOfWeek: dto.dayOfWeek,
        startDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        type: dto.type,
        label: dto.label,
        recurrenceType,
        recurrenceDaysOfWeek,
        recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
      },
    });
  }

  async findAll(userId: string, from?: string, to?: string) {
    const slots = await this.prisma.availabilitySlot.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
        { endTime: 'asc' },
      ],
    });

    if (!from || !to) {
      return slots;
    }

    return expandAvailabilityForRange(slots, new Date(from), new Date(to));
  }

  async update(userId: string, slotId: string, dto: UpdateAvailabilityDto) {
    const existingSlot = await this.findOwnedSlotOrThrow(userId, slotId);

    const nextStartTime = dto.startTime === null ? existingSlot.startTime : (dto.startTime ?? existingSlot.startTime);
    const nextEndTime = dto.endTime === null ? existingSlot.endTime : (dto.endTime ?? existingSlot.endTime);
    const nextDayOfWeek = dto.dayOfWeek ?? existingSlot.dayOfWeek;
    const nextStartDate = dto.startDate === null
      ? existingSlot.startDate
      : (dto.startDate ? new Date(dto.startDate) : existingSlot.startDate);
    const nextRecurrenceType = dto.recurrenceType ?? existingSlot.recurrenceType;
    const nextRecurrenceDays = nextRecurrenceType === RecurrenceType.WEEKLY
      ? (
          dto.recurrenceDaysOfWeek?.length
            ? dto.recurrenceDaysOfWeek
            : (existingSlot.recurrenceDaysOfWeek.length ? existingSlot.recurrenceDaysOfWeek : [nextDayOfWeek])
        )
      : [];
    const nextRecurrenceEndDate = dto.recurrenceEndDate === null
      ? undefined
      : (dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : existingSlot.recurrenceEndDate ?? undefined);

    this.assertValidTimeRange(nextStartTime, nextEndTime);
    assertValidRecurrenceInput(nextRecurrenceType, nextRecurrenceDays, nextStartDate, nextRecurrenceEndDate);
    await this.assertNoOverlap(userId, {
      dayOfWeek: nextDayOfWeek,
      startDate: nextStartDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      recurrenceType: nextRecurrenceType,
      recurrenceDaysOfWeek: nextRecurrenceDays.length ? nextRecurrenceDays : [nextDayOfWeek],
      recurrenceEndDate: nextRecurrenceEndDate,
    }, slotId);

    return this.prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        dayOfWeek: nextDayOfWeek,
        startDate: nextStartDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        type: dto.type ?? existingSlot.type,
        label: dto.label === undefined ? existingSlot.label : dto.label,
        recurrenceType: nextRecurrenceType,
        recurrenceDaysOfWeek: nextRecurrenceDays,
        recurrenceEndDate: dto.recurrenceEndDate === null
          ? null
          : (nextRecurrenceEndDate ?? null),
      },
    });
  }

  async remove(userId: string, slotId: string) {
    await this.findOwnedSlotOrThrow(userId, slotId);

    return this.prisma.availabilitySlot.delete({
      where: { id: slotId },
    });
  }

  private async findOwnedSlotOrThrow(userId: string, slotId: string) {
    const slot = await this.prisma.availabilitySlot.findFirst({
      where: {
        id: slotId,
        userId,
      },
    });

    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    return slot;
  }

  private async assertNoOverlap(
    userId: string,
    candidate: {
      dayOfWeek: number;
      startDate: Date;
      startTime: string;
      endTime: string;
      recurrenceType: RecurrenceLike;
      recurrenceDaysOfWeek: number[];
      recurrenceEndDate?: Date;
    },
    excludeSlotId?: string,
  ) {
    const existingSlots = await this.prisma.availabilitySlot.findMany({
      where: {
        userId,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
      },
    });

    const horizonStart = startOfDay(candidate.startDate);
    const horizonEnd = startOfDay(candidate.recurrenceEndDate ?? new Date(horizonStart.getFullYear() + 1, horizonStart.getMonth(), horizonStart.getDate()));
    const candidateOccurrences = expandAvailabilityForRange([
      {
        id: 'candidate',
        userId,
        dayOfWeek: candidate.dayOfWeek,
        startDate: candidate.startDate,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        type: existingSlots[0]?.type ?? AvailabilityType.WORK,
        label: undefined,
        recurrenceType: candidate.recurrenceType,
        recurrenceDaysOfWeek: candidate.recurrenceDaysOfWeek,
        recurrenceEndDate: candidate.recurrenceEndDate,
      },
    ], horizonStart, horizonEnd);
    const existingOccurrences = expandAvailabilityForRange(existingSlots, horizonStart, horizonEnd);

    for (const nextOccurrence of candidateOccurrences) {
      const overlappingOccurrence = existingOccurrences.find((slot) => {
        if (!slot.occurrenceDate || !nextOccurrence.occurrenceDate) {
          return false;
        }

        if (slot.occurrenceDate.getTime() !== nextOccurrence.occurrenceDate.getTime()) {
          return false;
        }

        return slot.startTime < nextOccurrence.endTime && slot.endTime > nextOccurrence.startTime;
      });

      if (overlappingOccurrence) {
        throw new ConflictException('Availability slot overlaps with an existing schedule block');
      }
    }
  }

  private assertValidTimeRange(startTime: string, endTime: string) {
    if (this.parseMinutes(endTime) <= this.parseMinutes(startTime)) {
      throw new BadRequestException('endTime must be later than startTime');
    }
  }

  private parseMinutes(time: string) {
    const [hours, minutes] = time.split(':').map((value) => Number.parseInt(value, 10));
    return hours * 60 + minutes;
  }
}
