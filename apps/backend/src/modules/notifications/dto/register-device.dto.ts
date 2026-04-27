import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';

const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]\s]+\]$/;

export class RegisterDeviceDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Matches(EXPO_PUSH_TOKEN_PATTERN)
  token!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString()
  @IsIn(['ios', 'android', 'expo'])
  @Length(3, 10)
  platform!: string;
}
