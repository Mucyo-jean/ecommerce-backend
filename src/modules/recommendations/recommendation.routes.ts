import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { z } from 'zod';
import * as controller from './recommendation.controller';

const router = Router();

const productIdParam = z.object({ params: z.object({ productId: z.string().uuid() }) });

/**
 * @swagger
 * /recommendations/trending:
 *   get:
 *     summary: Trending products (recent views + sales, innovation)
 *     tags: [Recommendations]
 *     security: []
 *     responses:
 *       200: { description: Trending products }
 */
router.get('/trending', controller.trending);

/**
 * @swagger
 * /recommendations/also-viewed/{productId}:
 *   get:
 *     summary: "Customers who viewed this also viewed (collaborative, innovation)"
 *     tags: [Recommendations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Recommended products }
 */
router.get('/also-viewed/:productId', validate(productIdParam), controller.alsoViewed);

/**
 * @swagger
 * /recommendations/related/{productId}:
 *   get:
 *     summary: Related products from the same category (content-based)
 *     tags: [Recommendations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Related products }
 */
router.get('/related/:productId', validate(productIdParam), controller.related);

/**
 * @swagger
 * /recommendations/for-you:
 *   get:
 *     summary: Personalized recommendations for the logged-in user (innovation)
 *     tags: [Recommendations]
 *     responses:
 *       200: { description: Personalized products }
 *       401: { description: Unauthorized }
 */
router.get('/for-you', authenticate, controller.forYou);

export default router;
