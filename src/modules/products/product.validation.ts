import { z } from 'zod';

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(12),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).optional().default('newest'),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    price: z.coerce.number().positive(),
    stock: z.coerce.number().int().min(0).default(0),
    categoryId: z.string().uuid(),
    imageUrl: z.string().url().optional(),
    currency: z.string().length(3).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    price: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().min(0).optional(),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    currency: z.string().length(3).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
