import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(100).default(1),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ productId: z.string().uuid() }),
  body: z.object({
    quantity: z.coerce.number().int().min(1).max(100),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({ productId: z.string().uuid() }),
});
