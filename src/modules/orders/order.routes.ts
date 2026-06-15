import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  checkoutSchema,
  idParamSchema,
  updateStatusSchema,
  listOrdersSchema,
} from './order.validation';
import * as controller from './order.controller';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Place an order from the current cart (checkout)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, customerEmail, customerPhone, shippingAddress, city, paymentMethod]
 *             properties:
 *               customerName: { type: string, example: Aline Uwase }
 *               customerEmail: { type: string, example: aline@example.com }
 *               customerPhone: { type: string, example: "+250788000000" }
 *               shippingAddress: { type: string, example: KK 508 St, Gasabo }
 *               city: { type: string, example: Kigali }
 *               notes: { type: string }
 *               paymentMethod:
 *                 type: string
 *                 enum: [MOBILE_MONEY, STRIPE_CARD, CASH_ON_DELIVERY]
 *     responses:
 *       201: { description: Order placed }
 *       400: { description: Empty cart or insufficient stock }
 */
router.post('/checkout', validate(checkoutSchema), controller.checkout);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: List the authenticated user's orders
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200: { description: Order list }
 */
router.get('/my', validate(listOrdersSchema), controller.myOrders);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders (admin only)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
 *     responses:
 *       200: { description: Order list }
 */
router.get('/', authorize(Role.ADMIN), validate(listOrdersSchema), controller.allOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get a single order (owner or admin)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Order }
 *       403: { description: Not your order }
 */
router.get('/:id', validate(idParamSchema), controller.getOne);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (admin only)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200: { description: Updated }
 */
router.patch(
  '/:id/status',
  authorize(Role.ADMIN),
  validate(updateStatusSchema),
  controller.updateStatus,
);

export default router;
