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
