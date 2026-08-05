/**
 * Health endpoint for Cloud Run.
 * `GET /health` returns 200 if the process is up; `?deep=true` also pings the DB.
 */

import { Controller, Get, Query, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../db/db.module.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async check(@Query('deep') deep?: string) {
    if (deep === 'true') {
      await this.db.execute(sql`select 1`);
    }
    return { status: 'ok' };
  }
}
