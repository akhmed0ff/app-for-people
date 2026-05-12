export const appConfig = () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3000),
  API_PREFIX: process.env.API_PREFIX ?? 'api/v1',
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  DEV_LOGIN_ENABLED: process.env.DEV_LOGIN_ENABLED === 'true',
});
