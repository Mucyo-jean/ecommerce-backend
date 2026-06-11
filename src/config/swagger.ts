import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Matic E-Commerce API',
      version: '1.0.0',
      description:
        'REST API for the Matic E-Commerce platform — a modern online store for a Rwandan business. ' +
        'Built with Express, Prisma and PostgreSQL. Use the **Authorize** button with a Bearer access token ' +
        'obtained from `/auth/login` to call protected endpoints.',
      contact: { name: 'Matic', email: 'info@matic.rw' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: env.apiPrefix, description: 'Current server' },
      { url: `http://localhost:${env.port}${env.apiPrefix}`, description: 'Local dev' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', example: 14999.99 },
            currency: { type: 'string', example: 'RWF' },
            stock: { type: 'integer', example: 25 },
            imageUrl: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            rating: { type: 'number', example: 4.5 },
            categoryId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Service status' },
      { name: 'Auth', description: 'Registration, login, profile' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Cart', description: 'Shopping cart (authenticated customers)' },
      { name: 'Orders', description: 'Checkout and order management' },
      { name: 'Payments', description: 'Mobile Money / Card payments (innovation)' },
      { name: 'Recommendations', description: 'AI-style product recommendations (innovation)' },
      { name: 'Analytics', description: 'Admin sales analytics dashboard (innovation)' },
    ],
  },
  // Pull JSDoc @swagger blocks from every route file.
  // When running compiled (dist) we read .js; in dev (ts-node) we read .ts.
  // Scanning both causes stale dist files to clash with live src files.
  apis: __filename.endsWith('.js')
    ? ['./dist/modules/**/*.routes.js', './dist/routes/*.js']
    : ['./src/modules/**/*.routes.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
