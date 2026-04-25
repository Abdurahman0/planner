import 'dotenv/config';
import type { StringValue } from 'ms';

export function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getJwtSecret() {
  const secret = requireEnv('JWT_SECRET');

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return secret;
}

export function getJwtExpiresIn(): StringValue | number {
  const rawValue = process.env.JWT_EXPIRES_IN?.trim() || '1h';
  const numericValue = Number.parseInt(rawValue, 10);

  if (/^\d+$/.test(rawValue) && Number.isInteger(numericValue) && numericValue > 0) {
    return numericValue;
  }

  return rawValue as StringValue;
}

export function getAiApiKey() {
  return requireEnv('GEMINI_API_KEY');
}

export function getAiModel() {
  return process.env.AI_MODEL?.trim() || 'gemini-2.5-flash';
}

export function getAppBaseUrl() {
  return requireEnv('APP_BASE_URL').replace(/\/+$/, '');
}

export function getPaymentReturnUrl() {
  return process.env.PAYMENT_RETURN_URL?.trim()?.replace(/\/+$/, '') || getAppBaseUrl();
}

export function getPaymeMerchantId() {
  return requireEnv('PAYME_MERCHANT_ID');
}

export function getPaymeMerchantKey() {
  return requireEnv('PAYME_MERCHANT_KEY');
}

export function getPaymeMerchantLogin() {
  return process.env.PAYME_MERCHANT_LOGIN?.trim() || getPaymeMerchantId();
}

export function getPaymeCheckoutUrl() {
  return process.env.PAYME_CHECKOUT_URL?.trim()?.replace(/\/+$/, '') || 'https://checkout.paycom.uz';
}

export function getClickServiceId() {
  return requireEnv('CLICK_SERVICE_ID');
}

export function getClickMerchantId() {
  return requireEnv('CLICK_MERCHANT_ID');
}

export function getClickSecretKey() {
  return requireEnv('CLICK_SECRET_KEY');
}

export function getClickCheckoutUrl() {
  return process.env.CLICK_CHECKOUT_URL?.trim()?.replace(/\/+$/, '') || 'https://my.click.uz/services/pay';
}
