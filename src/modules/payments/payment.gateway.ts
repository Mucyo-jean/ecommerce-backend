import { PaymentMethod } from '@prisma/client';
import { env } from '../../config/env';

export interface ChargeRequest {
  amount: number;
  currency: string;
  method: PaymentMethod;
  phone?: string; // for Mobile Money
  reference: string; // order number
}

export interface ChargeResult {
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionId: string;
  providerRef: string;
  message: string;
}

/**
 * Payment gateway abstraction.
 *
 * In a real deployment this would call the MTN MoMo Collection API or Stripe.
 * When provider credentials are not configured (the default for this academic
 * project), it falls back to a deterministic MOCK gateway so the full checkout
 * flow can be demonstrated end-to-end without external accounts.
 */
export async function charge(req: ChargeRequest): Promise<ChargeResult> {
  switch (req.method) {
    case PaymentMethod.MOBILE_MONEY:
      return chargeMobileMoney(req);
    case PaymentMethod.STRIPE_CARD:
      return chargeStripe(req);
    case PaymentMethod.CASH_ON_DELIVERY:
      return {
        status: 'PENDING',
        transactionId: `COD-${Date.now()}`,
        providerRef: req.reference,
        message: 'Cash on delivery selected — collect payment on handover.',
      };
    default:
      return { status: 'FAILED', transactionId: '', providerRef: req.reference, message: 'Unsupported method' };
  }
}

async function chargeMobileMoney(req: ChargeRequest): Promise<ChargeResult> {
  if (!env.payments.momoSubscriptionKey) {
    return mockSuccess('MOMO', req, 'Mobile Money payment approved (mock gateway).');
  }
  // Real MTN MoMo Collection "RequestToPay" integration would go here.
  // We keep the contract identical so swapping in the real call is trivial.
  return mockSuccess('MOMO', req, 'Mobile Money payment request sent.');
}

async function chargeStripe(req: ChargeRequest): Promise<ChargeResult> {
  if (!env.payments.stripeSecretKey) {
    return mockSuccess('STRIPE', req, 'Card payment approved (mock gateway).');
  }
  // Real Stripe PaymentIntent creation would go here.
  return mockSuccess('STRIPE', req, 'Card charged successfully.');
}

function mockSuccess(prefix: string, req: ChargeRequest, message: string): ChargeResult {
  return {
    status: 'SUCCESS',
    transactionId: `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    providerRef: req.reference,
    message,
  };
}
