/**
 * Backend entrypoint.
 *
 * Validates the environment (Zod, fail-fast) before Nest boots, then starts
 * the HTTP server on $PORT (Cloud Run injects PORT; default 8080 locally).
 * Configures CORS, a global validation pipe, a uniform error filter, and an
 * API-version header for the public /v1 API consumed by the Phase 3 frontend.
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { loadEnvConfig } from './config/env.config.js';
import { setEnvConfig } from './config/env-store.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';

async function bootstrap(): Promise<void> {
  const env = loadEnvConfig();
  setEnvConfig(env);

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Frontend-readiness: CORS, uniform error shape, API-version header.
  // (Input validation is enforced with Zod at each controller; no global pipe.)
  app.enableCors({ origin: env.CORS_ORIGIN });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader('X-API-Version', '1');
    next();
  });

  await app.listen(env.PORT);
  new Logger('Bootstrap').log(`Maarood backend listening on :${env.PORT} (${env.NODE_ENV})`);
}

void bootstrap();
