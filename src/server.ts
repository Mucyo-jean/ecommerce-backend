import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function bootstrap() {
  const app = createApp();

  // Verify the database connection before accepting traffic.
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Connected to PostgreSQL');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to connect to the database', err);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Matic API running on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`📚 Swagger docs at  http://localhost:${env.port}/docs`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
