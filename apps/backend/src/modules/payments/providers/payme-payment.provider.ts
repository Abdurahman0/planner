import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import {
  getPaymeCheckoutUrl,
  getPaymeMerchantId,
  getPaymeMerchantKey,
  getPaymeMerchantLogin,
  getPaymentReturnUrl,
} from '../../../config/env';
import {
  type NormalizedPaymentWebhook,
  type PaymentInitiationPayload,
  type PaymentInitiationTransaction,
  type PaymentProviderAdapter,
  type PaymeMethod,
  type PaymeWebhookPayload,
} from './payment-provider.interface';

const PAYME_ALLOWED_IPS = new Set([
  '185.234.113.1',
  '185.234.113.2',
  '185.234.113.3',
  '185.234.113.4',
  '185.234.113.5',
  '185.234.113.6',
  '185.234.113.7',
  '185.234.113.8',
  '185.234.113.9',
  '185.234.113.10',
  '185.234.113.11',
  '185.234.113.12',
  '185.234.113.13',
  '185.234.113.14',
  '185.234.113.15',
]);

const SUPPORTED_PAYME_METHODS = new Set<PaymeMethod>([
  'CheckPerformTransaction',
  'CreateTransaction',
  'PerformTransaction',
  'CancelTransaction',
  'CheckTransaction',
  'GetStatement',
]);

@Injectable()
export class PaymePaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.payme;

  buildInitiationPayload(transaction: PaymentInitiationTransaction): PaymentInitiationPayload {
    const merchantId = getPaymeMerchantId();
    const checkoutUrl = getPaymeCheckoutUrl();
    const returnUrl = getPaymentReturnUrl();
    const params = [
      `m=${merchantId}`,
      `ac.order_id=${transaction.localReference}`,
      `a=${transaction.amountMinor}`,
      `c=${returnUrl}`,
      'l=en',
    ].join(';');
    const encoded = Buffer.from(params).toString('base64');

    return {
      provider: this.provider,
      checkout: {
        method: 'GET',
        url: `${checkoutUrl}/${encoded}`,
        fields: {
          merchant: merchantId,
          'account[order_id]': transaction.localReference,
          amount: String(transaction.amountMinor),
          lang: 'en',
        },
      },
    };
  }

  async verifyAndNormalizeWebhook(request: Request): Promise<NormalizedPaymentWebhook> {
    this.assertAllowedIp(request);
    this.assertAuthorization(request);

    const body = request.body as Record<string, unknown>;
    const method = body.method;

    if (typeof method !== 'string' || !SUPPORTED_PAYME_METHODS.has(method as PaymeMethod)) {
      throw new BadRequestException('Unsupported Payme method');
    }

    const params = body.params;
    const id = body.id ?? null;

    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new BadRequestException('Invalid Payme params');
    }

    const payload: PaymeWebhookPayload = {
      id: typeof id === 'string' || typeof id === 'number' ? id : null,
      method: method as PaymeMethod,
      params: params as Record<string, unknown>,
    };

    return {
      provider: 'payme',
      kind: 'payme',
      payload,
    };
  }

  private assertAllowedIp(request: Request) {
    const normalizedIp = normalizeIp(request.ip);

    if (!PAYME_ALLOWED_IPS.has(normalizedIp)) {
      throw new UnauthorizedException('Untrusted Payme source');
    }
  }

  private assertAuthorization(request: Request) {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing Payme authorization');
    }

    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    const expected = `${getPaymeMerchantLogin()}:${getPaymeMerchantKey()}`;

    if (!safeEqual(decoded, expected)) {
      throw new UnauthorizedException('Invalid Payme authorization');
    }
  }
}

function normalizeIp(ip: string | undefined) {
  const value = (ip ?? '').trim();
  return value.startsWith('::ffff:') ? value.slice(7) : value;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
