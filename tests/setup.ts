// Ensure required env vars exist so the app can be imported during unit tests
// even when no .env file / database is present.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://matic:matic@localhost:5432/matic_test?schema=public';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret';
process.env.NODE_ENV = 'test';
