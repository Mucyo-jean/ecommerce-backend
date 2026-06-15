import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export const checkoutSchema = z.object({
  body: z.object({
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(7),
    shippingAddress: z.string().min(3),
    city: z.string().min(2),
    notes: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    status: z.nativeEnum(OrderStatus).optional(),
  }),
});
