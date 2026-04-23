import { SubscriptionPlan } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
