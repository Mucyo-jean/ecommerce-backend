import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
} from './category.validation';
import * as controller from './category.controller';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200: { description: Array of categories }
 */
router.get('/', controller.list);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category with its active products
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Category }
 *       404: { description: Not found }
 */
router.get('/:id', validate(idParamSchema), controller.getOne);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Electronics }
 *               description: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       201: { description: Created }
 *       403: { description: Forbidden }
 */
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createCategorySchema),
  controller.create,
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(updateCategorySchema),
  controller.update,
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       409: { description: Category still has products }
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(idParamSchema),
  controller.remove,
);

export default router;
