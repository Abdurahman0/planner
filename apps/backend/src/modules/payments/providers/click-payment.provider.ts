import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import {
  getClickCheckoutUrl,
  getClickMerchantId,
  getClickSecretKey,
  getClickServiceId,
  getPaymentReturnUrl,
} from '../../../config/env';
import {
  type ClickWebhookPayload,
  type NormalizedPaymentWebhook,
  type PaymentInitiationPayload,
  type PaymentInitiationTransaction,
  type PaymentProviderAdapter,
} from './payment-provider.interface';

@Injectable()
export class ClickPaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.click;

  buildInitiationPayload(transaction: PaymentInitiationTransaction): PaymentInitiationPayload {
    const paymentUrl = new URL(getClickCheckoutUrl());
    paymentUrl.searchParams.set('service_id', getClickServiceId());
    paymentUrl.searchParams.set('merchant_id', getClickMerchantId());
    paymentUrl.searchParams.set('amount', formatClickAmount(transaction.amountMinor));
    paymentUrl.searchParams.set('transaction_param', transaction.localReference);
    paymentUrl.searchParams.set('return_url', getPaymentReturnUrl());

    return {
      provider: this.provider,
      checkout: {
        method: 'GET',
        url: paymentUrl.toString(),
      },
    };
  }

  async verifyAndNormalizeWebhook(request: Request): Promise<NormalizedPaymentWebhook> {
    const body = request.body as Record<string, unknown>;

    const payload = this.parsePayload(body);
    const expectedServiceId = getClickServiceId();

    if (payload.serviceId !== expectedServiceId) {
      throw new BadRequestException('Invalid Click service id');
    }

    const expectedSignature = this.buildSignature(payload);

    if (!safeEqual(expectedSignature, payload.signString)) {
      throw new UnauthorizedException('Invalid Click signature');
    }

    return {
      provider: 'click',
      kind: 'click',
      action: payload.action === 0 ? 'prepare' : 'complete',
      payload,
    };
  }

  private parsePayload(body: Record<string, unknown>): ClickWebhookPayload {
    const clickTransId = readRequiredString(body, 'click_trans_id');
    const serviceId = readRequiredString(body, 'service_id');
    const clickPaydocId = readRequiredString(body, 'click_paydoc_id');
    const merchantTransId = readRequiredString(body, 'merchant_trans_id');
    const amount = readRequiredNumber(body, 'amount');
    const amountRaw = readRequiredRawString(body, 'amount');
    const action = readRequiredNumber(body, 'action');
    const error = readRequiredNumber(body, 'error');
    const errorNote = readRequiredString(body, 'error_note');
    const signTime = readRequiredString(body, 'sign_time');
    const signString = readRequiredString(body, 'sign_string');
    const merchantPrepareId = readOptionalString(body, 'merchant_prepare_id');

    if (action !== 0 && action !== 1) {
      throw new BadRequestException('Unsupported Click action');
    }

    return {
      clickTransId,
      serviceId,
      clickPaydocId,
      merchantTransId,
      merchantPrepareId,
      amount,
      amountRaw,
      action,
      error,
      errorNote,
      signTime,
      signString,
    };
  }

  private buildSignature(payload: ClickWebhookPayload) {
    const secret = getClickSecretKey();
    const raw = payload.action === 1
      ? `${payload.clickTransId}${payload.serviceId}${secret}${payload.merchantTransId}${payload.merchantPrepareId ?? ''}${payload.amountRaw}${payload.action}${payload.signTime}`
      : `${payload.clickTransId}${payload.serviceId}${secret}${payload.merchantTransId}${payload.amountRaw}${payload.action}${payload.signTime}`;

    return createHash('md5').update(raw).digest('hex');
  }
}

function readRequiredRawString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (value === undefined || value === null) {
    throw new BadRequestException(`Missing ${key}`);
  }

  return String(value).trim();
}

function readRequiredString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`Missing ${key}`);
  }

  return value.trim();
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`Invalid ${key}`);
  }

  return value.trim();
}

function readRequiredNumber(body: Record<string, unknown>, key: string) {
  const value = body[key];
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`Invalid ${key}`);
  }

  return parsed;
}

function formatClickAmount(amountMinor: number) {
  return (amountMinor / 100).toFixed(2).replace(/\.00$/, '');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
