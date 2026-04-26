import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { getInternalCronSecret } from '../../config/env';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthUser) {
    return this.notificationsService.list(user.id);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  summary(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getSummary(user.id);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  refresh(@CurrentUser() user: AuthUser) {
    return this.notificationsService.generateForUser(user.id);
  }

  @Post('devices')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(user.id, dto);
  }

  @Post('test-push')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  testPush(@CurrentUser() user: AuthUser) {
    return this.notificationsService.sendTestPush(user.id);
  }

  @Post('run-sweep')
  @HttpCode(200)
  runSweep(@Headers('x-internal-cron-secret') providedSecret?: string) {
    assertInternalCronSecret(providedSecret);
    return this.notificationsService.runSweep();
  }

  @Patch(':id/read')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  markRead(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) notificationId: string) {
    return this.notificationsService.markRead(user.id, notificationId);
  }
}

function assertInternalCronSecret(providedSecret?: string) {
  const expectedSecret = getInternalCronSecret();

  if (!providedSecret) {
    throw new UnauthorizedException('Invalid internal cron secret');
  }

  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedException('Invalid internal cron secret');
  }
}
