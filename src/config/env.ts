import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@matic.rw',
    password: process.env.ADMIN_PASSWORD ?? 'Admin@12345',
    name: process.env.ADMIN_NAME ?? 'Matic Administrator',
  },

  payments: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    momoBaseUrl: process.env.MOMO_API_BASE_URL ?? '',
    momoSubscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY ?? '',
    momoApiUser: process.env.MOMO_API_USER ?? '',
    momoApiKey: process.env.MOMO_API_KEY ?? '',
  },
};
