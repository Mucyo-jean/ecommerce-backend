import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '@prisma/client';
import * as controller from './analytics.controller';

const router = Router();

// All analytics endpoints are admin-only.
router.use(authenticate, authorize(Role.ADMIN));

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Key KPIs - revenue, orders, customers, stock alerts (admin, innovation)
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Dashboard metrics }
 *       403: { description: Admin only }
 */
router.get('/dashboard', controller.dashboard);

/**
 * @swagger
 * /analytics/sales:
 *   get:
 *     summary: Daily revenue & order time series (admin, innovation)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 14 }
 *     responses:
 *       200: { description: Sales time series }
 */
router.get('/sales', controller.sales);

/**
 * @swagger
 * /analytics/top-products:
 *   get:
 *     summary: Best-selling products by units sold (admin, innovation)
 *     tags: [Analytics]
 *     responses:
 *       200: { description: Top products }
 */
router.get('/top-products', controller.topProducts);

export default router;
