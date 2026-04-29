import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { assertValidOccurrenceRange } from '../shared/recurrence-utils';

@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(@Inject(AvailabilityService) private readonly availabilityService: AvailabilityService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    assertValidOccurrenceRange(from, to);
    return this.availabilityService.findAll(user.id, from, to);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) slotId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(user.id, slotId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) slotId: string) {
    return this.availabilityService.remove(user.id, slotId);
  }
}
