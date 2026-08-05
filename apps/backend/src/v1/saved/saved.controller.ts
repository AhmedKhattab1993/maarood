/**
 * Saved-product endpoints (anonymous, keyed by X-Device-Id).
 *   GET    /v1/saved                — list saved products for this device
 *   POST   /v1/saved/:productId     — save a product
 *   DELETE /v1/saved/:productId     — unsave a product
 *
 * The DeviceIdGuard validates the X-Device-Id header and attaches `deviceId`
 * to the request; controllers read it via @Req.
 */

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { products, savedProducts } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { DeviceIdGuard } from './device-id.guard';
import { mapProduct } from '../products/product-mapper';

interface DeviceRequest extends Request {
  deviceId: string;
}

@Controller('v1/saved')
@UseGuards(DeviceIdGuard)
export class SavedController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Req() req: DeviceRequest) {
    const rows = await this.db
      .select({ savedAt: savedProducts.savedAt, product: products })
      .from(savedProducts)
      .innerJoin(products, eq(products.id, savedProducts.productId))
      .where(eq(savedProducts.deviceId, req.deviceId))
      .orderBy(desc(savedProducts.savedAt));
    return rows.map((r) => ({
      savedAt: r.savedAt,
      product: mapProduct(r.product as unknown as Record<string, unknown>),
    }));
  }

  @Post(':productId')
  @HttpCode(201)
  async save(@Req() req: DeviceRequest, @Param('productId') productId: string) {
    const product = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (product.length === 0) throw new NotFoundException('Product not found');

    await this.db
      .insert(savedProducts)
      .values({ deviceId: req.deviceId, productId })
      .onConflictDoNothing({ target: [savedProducts.deviceId, savedProducts.productId] });
    return { saved: true };
  }

  @Delete(':productId')
  @HttpCode(204)
  async remove(@Req() req: DeviceRequest, @Param('productId') productId: string) {
    await this.db
      .delete(savedProducts)
      .where(
        and(eq(savedProducts.deviceId, req.deviceId), eq(savedProducts.productId, productId)),
      );
  }
}
