import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  idParamSchema,
} from './product.validation';
import * as controller from './product.controller';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products with search, filtering, sorting and pagination
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, price_asc, price_desc, rating] }
 *     responses:
 *       200: { description: Paginated product list }
 */
router.get('/', validate(listProductsSchema), controller.list);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a single product (records a view for recommendations)
 *     tags: [Products]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Product }
 *       404: { description: Not found }
 */
router.get('/:id', optionalAuth, validate(idParamSchema), controller.getOne);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product (admin only)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, categoryId]
 *             properties:
 *               name: { type: string, example: Samsung Galaxy A15 }
 *               description: { type: string, example: 6.5-inch display, 128GB storage }
 *               price: { type: number, example: 189999 }
 *               stock: { type: integer, example: 30 }
 *               categoryId: { type: string, format: uuid }
 *               imageUrl: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createProductSchema),
  controller.create,
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product (admin only)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Product' }
 *     responses:
 *       200: { description: Updated }
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(updateProductSchema),
  controller.update,
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Deactivate a product (admin only, soft delete)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deactivated }
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(idParamSchema),
  controller.remove,
);

export default router;
