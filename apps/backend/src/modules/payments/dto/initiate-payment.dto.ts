import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { PaymentProvider, SubscriptionPlan } from '@prisma/client';

export class InitiatePaymentDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsEnum(SubscriptionPlan)
  planType!: SubscriptionPlan;
}
