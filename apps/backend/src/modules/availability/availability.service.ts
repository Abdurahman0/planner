import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAvailabilityDto) {
    this.assertValidTimeRange(dto.startTime, dto.endTime);
    await this.assertNoOverlap(userId, dto.dayOfWeek, dto.startTime, dto.endTime);

    return this.prisma.availabilitySlot.create({
      data: {
        userId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        type: dto.type,
        label: dto.label,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.availabilitySlot.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
        { endTime: 'asc' },
      ],
    });
  }

  async update(userId: string, slotId: string, dto: UpdateAvailabilityDto) {
    const existingSlot = await this.findOwnedSlotOrThrow(userId, slotId);

    const nextStartTime = dto.startTime === null ? existingSlot.startTime : (dto.startTime ?? existingSlot.startTime);
    const nextEndTime = dto.endTime === null ? existingSlot.endTime : (dto.endTime ?? existingSlot.endTime);
    const nextDayOfWeek = dto.dayOfWeek ?? existingSlot.dayOfWeek;

    this.assertValidTimeRange(nextStartTime, nextEndTime);
    await this.assertNoOverlap(userId, nextDayOfWeek, nextStartTime, nextEndTime, slotId);

    return this.prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        dayOfWeek: nextDayOfWeek,
        startTime: nextStartTime,
        endTime: nextEndTime,
        type: dto.type ?? existingSlot.type,
        label: dto.label === undefined ? existingSlot.label : dto.label,
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
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ) {
    const overlappingSlot = await this.prisma.availabilitySlot.findFirst({
      where: {
        userId,
        dayOfWeek,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: { id: true },
    });

    if (overlappingSlot) {
      throw new ConflictException('Availability slot overlaps with an existing schedule block');
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
