import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './category.service';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const data = await service.listCategories();
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getCategory(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.createCategory(req.body);
  res.status(201).json({ success: true, message: 'Category created', data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.updateCategory(req.params.id, req.body);
  res.json({ success: true, message: 'Category updated', data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCategory(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});
