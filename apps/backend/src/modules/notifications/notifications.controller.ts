import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.id);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getSummary(user.id);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@CurrentUser() user: AuthUser) {
    return this.notificationsService.generateForUser(user.id);
  }

  @Post('devices')
  @HttpCode(200)
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(user.id, dto);
  }

  @Patch(':id/read')
  @HttpCode(200)
  markRead(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) notificationId: string) {
    return this.notificationsService.markRead(user.id, notificationId);
  }
}
