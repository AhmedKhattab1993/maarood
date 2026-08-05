/**
 * Backend entrypoint.
 *
 * Validates the environment (Zod, fail-fast) before Nest boots, then starts
 * the HTTP server on $PORT (Cloud Run injects PORT; default 8080 locally).
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadEnvConfig } from './config/env.config.js';

async function bootstrap(): Promise<void> {
  const env = loadEnvConfig();

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  await app.listen(env.PORT);
}

void bootstrap();
