import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file if available
dotenv.config();
console.log(
  'MongoDB URI loaded:',
  process.env.MONGODB_URI?.startsWith('mongodb+srv://')
);

const isProduction = process.env['NODE_ENV'] === 'production';

export const envSchema = z.object({
  PORT: z.coerce
    .number()
    .int()
    .min(1024, 'PORT must be between 1024 and 65535')
    .max(65535, 'PORT must be between 1024 and 65535')
    .default(4000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .default('mongodb://127.0.0.1:27017/savanna_gateway'),
  JWT_SECRET: isProduction
    ? z.string().min(32, 'JWT_SECRET must be at least 32 characters in production')
    : z.string().default('dev_jwt_access_secret_32_characters_minimum_len'),
  JWT_REFRESH_SECRET: isProduction
    ? z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters in production')
    : z.string().default('dev_jwt_refresh_secret_32_characters_minimum_len'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000'),
  ENCRYPTION_KEY: isProduction
    ? z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters in production')
    : z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  API_PREFIX: z
    .string()
    .default('/api/v1'),
});

export type Env = z.infer<typeof envSchema>;

function loadAndValidateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    const message = `[FATAL] Invalid environment configuration:\n${errorDetails}`;
    // Using standard console.error here because logger depends on env config
    console.error(message);
    throw new Error(message);
  }

  return result.data;
}

export const env: Env = loadAndValidateEnv();
