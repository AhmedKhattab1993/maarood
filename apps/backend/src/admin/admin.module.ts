import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [DbModule],
  controllers: [AdminController],
})
export class AdminModule {}
