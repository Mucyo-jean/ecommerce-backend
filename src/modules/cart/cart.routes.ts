import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { addItemSchema, updateItemSchema, productIdParamSchema } from './cart.validation';
import * as controller from './cart.controller';

const router = Router();

// All cart routes require an authenticated customer.
router.use(authenticate);

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the current user's cart with totals
 *     tags: [Cart]
 *     responses:
 *       200: { description: Cart contents }
 */
router.get('/', controller.get);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               quantity: { type: integer, example: 2 }
 *     responses:
 *       201: { description: Item added }
 *       400: { description: Insufficient stock }
 */
router.post('/items', validate(addItemSchema), controller.add);

/**
 * @swagger
 * /cart/items/{productId}:
 *   put:
 *     summary: Update the quantity of a cart item
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, example: 3 }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/items/:productId', validate(updateItemSchema), controller.update);

/**
 * @swagger
 * /cart/items/{productId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Removed }
 */
router.delete('/items/:productId', validate(productIdParamSchema), controller.remove);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Empty the cart
 *     tags: [Cart]
 *     responses:
 *       200: { description: Cleared }
 */
router.delete('/', controller.clear);

export default router;
