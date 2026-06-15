import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../lib/prisma';
import * as service from './product.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as any);
  res.json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProduct(req.params.id);

  // Record a view (fire-and-forget) to power recommendations & analytics.
  prisma.productView
    .create({ data: { productId: product.id, userId: req.user?.sub ?? null } })
    .catch(() => undefined);

  res.json({ success: true, data: product });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.createProduct(req.body);
  res.status(201).json({ success: true, message: 'Product created', data: product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.updateProduct(req.params.id, req.body);
  res.json({ success: true, message: 'Product updated', data: product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deactivated' });
});
