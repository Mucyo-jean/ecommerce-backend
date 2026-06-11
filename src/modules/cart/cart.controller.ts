import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './cart.service';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getCart(req.user!.sub);
  res.json({ success: true, data });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.addItem(req.user!.sub, req.body.productId, req.body.quantity);
  res.status(201).json({ success: true, message: 'Item added to cart', data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateItem(req.user!.sub, req.params.productId, req.body.quantity);
  res.json({ success: true, message: 'Cart updated', data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.removeItem(req.user!.sub, req.params.productId);
  res.json({ success: true, message: 'Item removed', data });
});

export const clear = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.clearCart(req.user!.sub);
  res.json({ success: true, message: 'Cart cleared', data });
});
