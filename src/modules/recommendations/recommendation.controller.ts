import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './recommendation.service';

export const alsoViewed = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.alsoViewed(req.params.productId);
  res.json({ success: true, strategy: 'customers-also-viewed', data });
});

export const related = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.relatedByCategory(req.params.productId);
  res.json({ success: true, strategy: 'related-by-category', data });
});

export const trending = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.trending();
  res.json({ success: true, strategy: 'trending', data });
});

export const forYou = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.forYou(req.user!.sub);
  res.json({ success: true, strategy: 'personalized', data });
});
