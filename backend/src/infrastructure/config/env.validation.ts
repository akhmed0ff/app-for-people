type Env = Record<string, string | undefined>;

const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MAPBOX_ACCESS_TOKEN',
];

export function validateEnv(env: Env) {
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    const unsafeSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((key) =>
      env[key]?.startsWith('replace-with'),
    );

    if (unsafeSecrets.length > 0) {
      throw new Error(`Unsafe production secrets: ${unsafeSecrets.join(', ')}`);
    }
  }

  return {
    ...env,
    NODE_ENV: nodeEnv,
    PORT: Number(env.PORT ?? 3000),
    API_PREFIX: env.API_PREFIX ?? 'api/v1',
    CORS_ORIGINS: env.CORS_ORIGINS ?? '',
    LOG_LEVEL: env.LOG_LEVEL ?? 'info',
    JWT_ACCESS_EXPIRES_IN: env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    DEV_LOGIN_ENABLED: env.DEV_LOGIN_ENABLED ?? 'false',
  };
}
