import { PaymentProvider, SubscriptionPlan } from '@prisma/client';
import type { Request } from 'express';

export interface PaymentInitiationTransaction {
  id: string;
  localReference: string;
  amountMinor: number;
  currency: string;
  planType: SubscriptionPlan;
  expiresAt: Date | null;
}

export interface PaymentCheckoutPayload {
  method: 'GET' | 'POST';
  url: string;
  fields?: Record<string, string>;
}

export interface PaymentInitiationPayload {
  provider: PaymentProvider;
  checkout: PaymentCheckoutPayload;
}

export interface ClickWebhookPayload {
  clickTransId: string;
  serviceId: string;
  clickPaydocId: string;
  merchantTransId: string;
  merchantPrepareId?: string;
  amount: number;
  amountRaw: string;
  action: 0 | 1;
  error: number;
  errorNote: string;
  signTime: string;
  signString: string;
}

export type PaymeMethod =
  | 'CheckPerformTransaction'
  | 'CreateTransaction'
  | 'PerformTransaction'
  | 'CancelTransaction'
  | 'CheckTransaction'
  | 'GetStatement';

export interface PaymeWebhookPayload {
  id: string | number | null;
  method: PaymeMethod;
  params: Record<string, unknown>;
}

export type NormalizedPaymentWebhook =
  | {
      provider: 'click';
      kind: 'click';
      action: 'prepare' | 'complete';
      payload: ClickWebhookPayload;
    }
  | {
      provider: 'payme';
      kind: 'payme';
      payload: PaymeWebhookPayload;
    };

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  buildInitiationPayload(transaction: PaymentInitiationTransaction): PaymentInitiationPayload;
  verifyAndNormalizeWebhook(request: Request): Promise<NormalizedPaymentWebhook>;
}
