import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    // Env is already validated + loaded into process.env by main.ts via loadEnvConfig().
    // ConfigModule here exposes ConfigService globally (isGlobal) so DbModule can read DATABASE_URL.
    ConfigModule.forRoot({ isGlobal: true, validate: () => process.env }),
    DbModule,
    HealthModule,
  ],
})
export class AppModule {}
