/**
 * Favourite-product endpoints, keyed by the signed-in user (Bearer).
 *   GET    /v1/saved
 *   POST   /v1/saved/:productId
 *   DELETE /v1/saved/:productId
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
import { and, desc, eq } from 'drizzle-orm';
import { products, savedProducts } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { mapProduct } from '../products/product-mapper';

interface AuthedRequest {
  userId: string;
}

@Controller('v1/saved')
@UseGuards(UserAuthGuard)
export class SavedController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Req() req: AuthedRequest) {
    const rows = await this.db
      .select({ savedAt: savedProducts.savedAt, product: products })
      .from(savedProducts)
      .innerJoin(products, eq(products.id, savedProducts.productId))
      .where(eq(savedProducts.userId, req.userId))
      .orderBy(desc(savedProducts.savedAt));
    return rows.map((r) => ({
      savedAt: r.savedAt,
      product: mapProduct(r.product as unknown as Record<string, unknown>),
    }));
  }

  @Post(':productId')
  @HttpCode(201)
  async save(@Req() req: AuthedRequest, @Param('productId') productId: string) {
    const product = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (product.length === 0) throw new NotFoundException('Product not found');

    await this.db
      .insert(savedProducts)
      .values({ userId: req.userId, productId })
      .onConflictDoNothing({ target: [savedProducts.userId, savedProducts.productId] });
    return { saved: true };
  }

  @Delete(':productId')
  @HttpCode(204)
  async remove(@Req() req: AuthedRequest, @Param('productId') productId: string) {
    await this.db
      .delete(savedProducts)
      .where(
        and(eq(savedProducts.userId, req.userId), eq(savedProducts.productId, productId)),
      );
  }
}
