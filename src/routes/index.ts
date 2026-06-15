import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import categoryRoutes from '../modules/categories/category.routes';
import productRoutes from '../modules/products/product.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/orders/order.routes';
import recommendationRoutes from '../modules/recommendations/recommendation.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is up
 */
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', service: 'matic-ecommerce-api', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
