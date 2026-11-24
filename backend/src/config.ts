import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name: string, devDefault: string): string {
  const v = process.env[name];
  if (v) return v;
  if (isProd) throw new Error(`Missing required environment variable ${name}`);
  return devDefault;
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5433/drinksup'),
  /** Azure Database for PostgreSQL requires TLS. */
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  /** Comma-separated list of allowed browser origins (storefront + admin). */
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',').map(s => s.trim()).filter(Boolean),
  /** Shopify store that takes the payment hand-off. */
  shopifyStore: process.env.SHOPIFY_STORE_URL || 'https://drinksup.com.au',
  /** Public URL of this API (used for locally stored uploads). */
  publicUrl: (process.env.PUBLIC_URL || '').replace(/\/$/, ''),
  azureStorage: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  azureContainer: process.env.AZURE_STORAGE_CONTAINER || 'product-images',
};
