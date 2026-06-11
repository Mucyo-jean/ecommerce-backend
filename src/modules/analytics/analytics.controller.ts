import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './analytics.service';

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.dashboard();
  res.json({ success: true, data });
});

export const sales = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(Math.max(parseInt(String(req.query.days ?? '14'), 10) || 14, 1), 90);
  const data = await service.salesTimeseries(days);
  res.json({ success: true, data });
});

export const topProducts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.topProducts();
  res.json({ success: true, data });
});
