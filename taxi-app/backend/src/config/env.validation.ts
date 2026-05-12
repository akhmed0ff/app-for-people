type Env = Record<string, string | undefined>;

const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'PORT', 'NODE_ENV', 'CORS_ORIGIN'];

export type AppEnvironment = {
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
};

export function validateEnv(env: Env): AppEnvironment {
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const port = Number(env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return {
    DATABASE_URL: env.DATABASE_URL!,
    REDIS_URL: env.REDIS_URL!,
    JWT_SECRET: env.JWT_SECRET!,
    PORT: port,
    NODE_ENV: env.NODE_ENV!,
    CORS_ORIGIN: env.CORS_ORIGIN!,
  };
}
