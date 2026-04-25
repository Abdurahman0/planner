import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ClickPaymentProvider } from './providers/click-payment.provider';
import { PaymePaymentProvider } from './providers/payme-payment.provider';
import {
  type ClickWebhookPayload,
  type NormalizedPaymentWebhook,
  type PaymeWebhookPayload,
} from './providers/payment-provider.interface';

const PLAN_CONFIG: Partial<Record<SubscriptionPlan, { amountMinor: number; durationDays: number }>> = {
  [SubscriptionPlan.ai_basic]: { amountMinor: 4_900_000, durationDays: 30 },
  [SubscriptionPlan.ai_pro]: { amountMinor: 7_900_000, durationDays: 30 },
};

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ClickPaymentProvider) private readonly clickProvider: ClickPaymentProvider,
    @Inject(PaymePaymentProvider) private readonly paymeProvider: PaymePaymentProvider,
  ) {}

  async initiate(user: AuthUser, dto: InitiatePaymentDto) {
    if (dto.planType === SubscriptionPlan.free) {
      throw new BadRequestException('Free plan does not require payment');
    }

    const planConfig = PLAN_CONFIG[dto.planType];

    if (!planConfig) {
      throw new BadRequestException('Unsupported subscription plan');
    }

    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        planType: dto.planType,
        provider: dto.provider,
        amountMinor: planConfig.amountMinor,
        localReference: this.createLocalReference(dto.provider),
        status: PaymentStatus.initiated,
        expiresAt: addMinutes(new Date(), 30),
      },
      select: this.paymentSelect,
    });

    const provider = this.getProvider(dto.provider);
    const providerPayload = provider.buildInitiationPayload(transaction);

    return {
      transactionId: transaction.id,
      localReference: transaction.localReference,
      provider: transaction.provider,
      planType: transaction.planType,
      amountMinor: transaction.amountMinor,
      currency: transaction.currency,
      expiresAt: transaction.expiresAt,
      checkout: providerPayload.checkout,
    };
  }

  async handleWebhook(request: Request) {
    const body = request.body as Record<string, unknown>;
    const isPaymeRequest = body && typeof body.method === 'string';

    if (isPaymeRequest) {
      try {
        const normalized = await this.paymeProvider.verifyAndNormalizeWebhook(request);
        if (normalized.kind !== 'payme') {
          return this.buildPaymeError(this.readRpcId(body.id), -32600, 'Invalid request');
        }

        return await this.handlePaymeWebhook(normalized.payload);
      } catch (error) {
        return this.buildPaymeExceptionResponse(this.readRpcId(body.id), error);
      }
    }

    const normalized = await this.detectAndNormalizeWebhook(request);

    if (normalized.kind !== 'click') {
      throw new BadRequestException('Invalid Click payload');
    }

    return this.handleClickWebhook(normalized.payload);
  }

  private async detectAndNormalizeWebhook(request: Request): Promise<NormalizedPaymentWebhook> {
    const body = request.body as Record<string, unknown>;

    if (body && typeof body.click_trans_id !== 'undefined') {
      return this.clickProvider.verifyAndNormalizeWebhook(request);
    }

    throw new BadRequestException('Unknown payment provider payload');
  }

  private async handleClickWebhook(payload: ClickWebhookPayload) {
    if (payload.action === 0) {
      return this.handleClickPrepare(payload);
    }

    return this.handleClickComplete(payload);
  }

  private async handleClickPrepare(payload: ClickWebhookPayload) {
    let transaction;

    try {
      transaction = await this.findClickTransactionByLocalReference(payload.merchantTransId);
      this.assertClickAmount(transaction.amountMinor, payload.amount);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.buildClickError(-6, 'Transaction does not exist');
      }

      if (error instanceof BadRequestException) {
        return this.buildClickError(-2, 'Incorrect amount');
      }

      throw error;
    }

    if (transaction.status === PaymentStatus.cancelled) {
      return this.buildClickError(-9, 'Transaction cancelled');
    }

    if (transaction.status === PaymentStatus.paid) {
      return this.buildClickSuccess(payload, transaction.id);
    }

    if (transaction.status === PaymentStatus.failed || transaction.status === PaymentStatus.expired) {
      return this.buildClickError(-4, 'Operation not allowed');
    }

    if (transaction.externalId && transaction.externalId !== payload.clickTransId) {
      return this.buildClickError(-4, 'Operation not allowed');
    }

    await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.pending,
        externalId: payload.clickTransId,
        providerPayload: toPrismaJson(payload),
        webhookAttempts: { increment: 1 },
        lastWebhookAt: new Date(),
      },
    });

    return this.buildClickSuccess(payload, transaction.id);
  }

  private async handleClickComplete(payload: ClickWebhookPayload) {
    let transaction = payload.merchantPrepareId
      ? await this.prisma.paymentTransaction.findFirst({
          where: {
            id: payload.merchantPrepareId,
            provider: PaymentProvider.click,
          },
          select: this.paymentSelect,
        })
      : await this.findClickTransactionByLocalReference(payload.merchantTransId);

    if (!transaction || transaction.localReference !== payload.merchantTransId) {
      return this.buildClickError(-6, 'Transaction does not exist');
    }

    try {
      this.assertClickAmount(transaction.amountMinor, payload.amount);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return this.buildClickError(-2, 'Incorrect amount');
      }

      throw error;
    }

    if (payload.error < 0) {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.failed,
          errorMessage: payload.errorNote,
          providerPayload: toPrismaJson(payload),
          webhookAttempts: { increment: 1 },
          lastWebhookAt: new Date(),
        },
      });

      return this.buildClickError(payload.error, payload.errorNote);
    }

    if (transaction.status === PaymentStatus.paid) {
      return this.buildClickSuccess(payload, transaction.id);
    }

    if (transaction.status === PaymentStatus.cancelled) {
      return this.buildClickError(-9, 'Transaction cancelled');
    }

    await this.completePaymentTransaction(transaction.id, payload.clickTransId, payload);

    return this.buildClickSuccess(payload, transaction.id);
  }

  private async handlePaymeWebhook(payload: PaymeWebhookPayload) {
    try {
      switch (payload.method) {
        case 'CheckPerformTransaction':
          return this.buildPaymeResult(payload.id, await this.handlePaymeCheckPerform(payload.params));
        case 'CreateTransaction':
          return this.buildPaymeResult(payload.id, await this.handlePaymeCreate(payload.params));
        case 'PerformTransaction':
          return this.buildPaymeResult(payload.id, await this.handlePaymePerform(payload.params));
        case 'CancelTransaction':
          return this.buildPaymeResult(payload.id, await this.handlePaymeCancel(payload.params));
        case 'CheckTransaction':
          return this.buildPaymeResult(payload.id, await this.handlePaymeCheck(payload.params));
        case 'GetStatement':
          return this.buildPaymeResult(payload.id, await this.handlePaymeStatement(payload.params));
        default:
          return this.buildPaymeError(payload.id, -32601, 'Requested method not found', payload.method);
      }
    } catch (error) {
      return this.buildPaymeExceptionResponse(payload.id, error);
    }
  }

  private async handlePaymeCheckPerform(params: Record<string, unknown>) {
    const amount = this.readPaymeAmount(params);
    const transaction = await this.findPaymeTransactionByAccount(params);

    if (!transaction) {
      throw new PaymeError(-31050, 'Order not found', 'account.order_id');
    }

    if (transaction.status === PaymentStatus.cancelled || transaction.status === PaymentStatus.failed || transaction.status === PaymentStatus.expired) {
      throw new PaymeError(-31008, 'Operation cannot be performed');
    }

    if (transaction.amountMinor !== amount) {
      throw new PaymeError(-31001, 'Invalid amount');
    }

    return { allow: true };
  }

  private async handlePaymeCreate(params: Record<string, unknown>) {
    const externalId = this.readPaymeId(params);
    const amount = this.readPaymeAmount(params);
    const transaction = await this.findPaymeTransactionByAccount(params);

    if (!transaction) {
      throw new PaymeError(-31050, 'Order not found', 'account.order_id');
    }

    if (transaction.amountMinor !== amount) {
      throw new PaymeError(-31001, 'Invalid amount');
    }

    if (transaction.status === PaymentStatus.paid || transaction.status === PaymentStatus.cancelled || transaction.status === PaymentStatus.failed) {
      throw new PaymeError(-31008, 'Operation cannot be performed');
    }

    if (transaction.externalId && transaction.externalId !== externalId) {
      throw new PaymeError(-31008, 'Operation cannot be performed');
    }

    const updated = await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        externalId,
        status: PaymentStatus.pending,
        providerPayload: toPrismaJson(params),
        webhookAttempts: { increment: 1 },
        lastWebhookAt: new Date(),
      },
      select: this.paymentSelect,
    });

    return {
      create_time: updated.initiatedAt.getTime(),
      transaction: updated.id,
      state: 1,
    };
  }

  private async handlePaymePerform(params: Record<string, unknown>) {
    const externalId = this.readPaymeId(params);
    const transaction = await this.findPaymentByExternalId(PaymentProvider.payme, externalId);

    if (!transaction) {
      throw new PaymeError(-31003, 'Transaction not found');
    }

    if (transaction.status === PaymentStatus.cancelled || transaction.status === PaymentStatus.failed || transaction.status === PaymentStatus.expired) {
      throw new PaymeError(-31008, 'Operation cannot be performed');
    }

    if (transaction.status !== PaymentStatus.paid) {
      await this.completePaymentTransaction(transaction.id, externalId, params);
    }

    const fresh = await this.findPaymentByIdOrThrow(transaction.id);

    return {
      transaction: fresh.id,
      perform_time: fresh.paidAt?.getTime() ?? 0,
      state: 2,
    };
  }

  private async handlePaymeCancel(params: Record<string, unknown>) {
    const externalId = this.readPaymeId(params);
    const reason = typeof params.reason === 'number' ? params.reason : null;
    const transaction = await this.findPaymentByExternalId(PaymentProvider.payme, externalId);

    if (!transaction) {
      throw new PaymeError(-31003, 'Transaction not found');
    }

    if (transaction.status === PaymentStatus.paid) {
      throw new PaymeError(-31007, 'Cannot cancel a fulfilled transaction');
    }

    const cancelled = await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.cancelled,
        cancelledAt: transaction.cancelledAt ?? new Date(),
        errorMessage: reason !== null ? `Cancel reason: ${reason}` : 'Cancelled by provider',
        providerPayload: toPrismaJson(params),
        webhookAttempts: { increment: 1 },
        lastWebhookAt: new Date(),
      },
      select: this.paymentSelect,
    });

    return {
      transaction: cancelled.id,
      cancel_time: cancelled.cancelledAt?.getTime() ?? 0,
      state: -1,
    };
  }

  private async handlePaymeCheck(params: Record<string, unknown>) {
    const externalId = this.readPaymeId(params);
    const transaction = await this.findPaymentByExternalId(PaymentProvider.payme, externalId);

    if (!transaction) {
      throw new PaymeError(-31003, 'Transaction not found');
    }

    return {
      create_time: transaction.initiatedAt.getTime(),
      perform_time: transaction.paidAt?.getTime() ?? 0,
      cancel_time: transaction.cancelledAt?.getTime() ?? 0,
      transaction: transaction.id,
      state: mapPaymeState(transaction.status),
      reason: transaction.status === PaymentStatus.cancelled ? 1 : null,
    };
  }

  private async handlePaymeStatement(params: Record<string, unknown>) {
    const from = typeof params.from === 'number' ? params.from : Number.parseInt(String(params.from ?? ''), 10);
    const to = typeof params.to === 'number' ? params.to : Number.parseInt(String(params.to ?? ''), 10);

    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      throw new PaymeError(-32600, 'Invalid statement range');
    }

    const transactions = await this.prisma.paymentTransaction.findMany({
      where: {
        provider: PaymentProvider.payme,
        externalId: { not: null },
        initiatedAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { initiatedAt: 'asc' },
      select: this.paymentSelect,
    });

    return {
      transactions: transactions.map((transaction) => ({
        id: transaction.externalId,
        time: transaction.initiatedAt.getTime(),
        amount: transaction.amountMinor,
        account: {
          order_id: transaction.localReference,
        },
        create_time: transaction.initiatedAt.getTime(),
        perform_time: transaction.paidAt?.getTime() ?? 0,
        cancel_time: transaction.cancelledAt?.getTime() ?? 0,
        transaction: transaction.id,
        state: mapPaymeState(transaction.status),
        reason: transaction.status === PaymentStatus.cancelled ? 1 : null,
      })),
    };
  }

  private async completePaymentTransaction(
    transactionId: string,
    externalId: string,
    providerPayload: unknown,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findUnique({
        where: { id: transactionId },
        select: this.paymentSelect,
      });

      if (!payment) {
        throw new NotFoundException('Payment transaction not found');
      }

      if (payment.processedAt) {
        return payment;
      }

      const now = new Date();
      const planConfig = PLAN_CONFIG[payment.planType];

      if (!planConfig) {
        throw new BadRequestException('Unsupported subscription plan');
      }

      const currentSubscription = await tx.subscription.findFirst({
        where: {
          userId: payment.userId,
          status: SubscriptionStatus.active,
        },
        orderBy: {
          endDate: 'desc',
        },
      });

      const startDate = currentSubscription?.endDate && currentSubscription.endDate > now
        ? currentSubscription.endDate
        : now;
      const endDate = addDays(startDate, planConfig.durationDays);

      if (currentSubscription) {
        await tx.subscription.update({
          where: { id: currentSubscription.id },
          data: {
            planType: payment.planType,
            status: SubscriptionStatus.active,
            paymentId: payment.id,
            endDate,
          },
        });
      } else {
        await tx.subscription.create({
          data: {
            userId: payment.userId,
            planType: payment.planType,
            status: SubscriptionStatus.active,
            paymentId: payment.id,
            startDate: now,
            endDate,
          },
        });
      }

      await tx.user.update({
        where: { id: payment.userId },
        data: {
          subscriptionPlan: payment.planType,
        },
      });

      return tx.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.paid,
          externalId,
          providerPayload: toPrismaJson(providerPayload),
          paidAt: payment.paidAt ?? now,
          processedAt: now,
          webhookAttempts: { increment: 1 },
          lastWebhookAt: now,
        },
        select: this.paymentSelect,
      });
    });
  }

  private async findClickTransactionByLocalReference(localReference: string) {
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: {
        localReference,
        provider: PaymentProvider.click,
      },
      select: this.paymentSelect,
    });

    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    return transaction;
  }

  private async findPaymeTransactionByAccount(params: Record<string, unknown>) {
    const account = params.account;

    if (!account || typeof account !== 'object' || Array.isArray(account)) {
      throw new PaymeError(-31050, 'Order not found', 'account.order_id');
    }

    const orderId = (account as Record<string, unknown>).order_id;

    if (typeof orderId !== 'string' || orderId.trim().length === 0) {
      throw new PaymeError(-31050, 'Order not found', 'account.order_id');
    }

    return this.prisma.paymentTransaction.findFirst({
      where: {
        localReference: orderId.trim(),
        provider: PaymentProvider.payme,
      },
      select: this.paymentSelect,
    });
  }

  private async findPaymentByExternalId(provider: PaymentProvider, externalId: string) {
    return this.prisma.paymentTransaction.findFirst({
      where: {
        provider,
        externalId,
      },
      select: this.paymentSelect,
    });
  }

  private async findPaymentByIdOrThrow(id: string) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      select: this.paymentSelect,
    });

    if (!payment) {
      throw new NotFoundException('Payment transaction not found');
    }

    return payment;
  }

  private buildClickSuccess(payload: ClickWebhookPayload, merchantPrepareId: string) {
    return {
      click_trans_id: payload.clickTransId,
      merchant_trans_id: payload.merchantTransId,
      merchant_prepare_id: merchantPrepareId,
      error: 0,
      error_note: 'Success',
    };
  }

  private buildClickError(code: number, note: string) {
    return {
      error: code,
      error_note: note,
    };
  }

  private buildPaymeResult(id: string | number | null, result: unknown) {
    return {
      id,
      result,
    };
  }

  private buildPaymeError(id: string | number | null, code: number, message: string, data?: string) {
    return {
      id,
      error: {
        code,
        message: {
          en: message,
          ru: message,
          uz: message,
        },
        data,
      },
    };
  }

  private buildPaymeExceptionResponse(id: string | number | null, error: unknown) {
    if (error instanceof PaymeError) {
      return this.buildPaymeError(id, error.code, error.message, error.data);
    }

    if (error instanceof UnauthorizedException) {
      return this.buildPaymeError(id, -32504, 'Insufficient privileges');
    }

    if (error instanceof BadRequestException) {
      return this.buildPaymeError(id, -32600, 'Invalid request');
    }

    return this.buildPaymeError(id, -32400, 'System error');
  }

  private readRpcId(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return null;
  }

  private getProvider(provider: PaymentProvider) {
    switch (provider) {
      case PaymentProvider.click:
        return this.clickProvider;
      case PaymentProvider.payme:
        return this.paymeProvider;
      default:
        throw new BadRequestException('Unsupported payment provider');
    }
  }

  private createLocalReference(provider: PaymentProvider) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${provider}_${timestamp}_${random}`;
  }

  private assertClickAmount(amountMinor: number, clickAmount: number) {
    const expected = Number((amountMinor / 100).toFixed(2));

    if (Math.abs(expected - clickAmount) > 0.0001) {
      throw new BadRequestException('Invalid Click amount');
    }
  }

  private readPaymeAmount(params: Record<string, unknown>) {
    const rawAmount = params.amount;
    const amount = typeof rawAmount === 'number' ? rawAmount : Number.parseInt(String(rawAmount ?? ''), 10);

    if (!Number.isInteger(amount) || amount <= 0) {
      throw new PaymeError(-32600, 'Invalid amount');
    }

    return amount;
  }

  private readPaymeId(params: Record<string, unknown>) {
    const value = params.id;

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new PaymeError(-32600, 'Invalid transaction id');
    }

    return value.trim();
  }

  private readonly paymentSelect = {
    id: true,
    userId: true,
    planType: true,
    provider: true,
    status: true,
    amountMinor: true,
    currency: true,
    localReference: true,
    externalId: true,
    providerPayload: true,
    errorMessage: true,
    webhookAttempts: true,
    initiatedAt: true,
    paidAt: true,
    processedAt: true,
    cancelledAt: true,
    expiresAt: true,
    lastWebhookAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

class PaymeError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: string,
  ) {
    super(message);
  }
}

function mapPaymeState(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.pending:
    case PaymentStatus.initiated:
      return 1;
    case PaymentStatus.paid:
      return 2;
    case PaymentStatus.cancelled:
      return -1;
    case PaymentStatus.failed:
    case PaymentStatus.expired:
      return -2;
    default:
      return 1;
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}
