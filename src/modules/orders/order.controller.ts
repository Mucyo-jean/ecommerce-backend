import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './order.service';

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const order = await service.checkout(req.user!.sub, req.body);
  res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
});

export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listMyOrders(req.user!.sub, req.query as any);
  res.json({ success: true, ...result });
});

export const allOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listAllOrders(req.query as any);
  res.json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const isAdmin = req.user!.role === Role.ADMIN;
  const order = await service.getOrderById(req.params.id, req.user!.sub, isAdmin);
  res.json({ success: true, data: order });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await service.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, message: 'Order status updated', data: order });
});
