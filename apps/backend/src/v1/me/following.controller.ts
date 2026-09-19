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
import { and, eq } from 'drizzle-orm';
import { followedMerchants, merchants } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { UserAuthGuard } from '../../auth/user-auth.guard';

interface AuthedRequest {
  userId: string;
}

@Controller('v1/me/following')
@UseGuards(UserAuthGuard)
export class FollowingController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Req() req: AuthedRequest) {
    const rows = await this.db
      .select({
        merchantId: followedMerchants.merchantId,
        slug: merchants.slug,
        name: merchants.name,
        logoUrl: merchants.logoUrl,
        followedAt: followedMerchants.followedAt,
      })
      .from(followedMerchants)
      .innerJoin(merchants, eq(merchants.id, followedMerchants.merchantId))
      .where(eq(followedMerchants.userId, req.userId));
    return { items: rows };
  }

  @Post(':merchantId')
  @HttpCode(201)
  async follow(@Req() req: AuthedRequest, @Param('merchantId') merchantId: string) {
    const found = await this.db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);
    if (found.length === 0) throw new NotFoundException('Brand not found');

    await this.db
      .insert(followedMerchants)
      .values({ userId: req.userId, merchantId })
      .onConflictDoNothing({
        target: [followedMerchants.userId, followedMerchants.merchantId],
      });
    return { following: true };
  }

  @Delete(':merchantId')
  @HttpCode(204)
  async unfollow(@Req() req: AuthedRequest, @Param('merchantId') merchantId: string) {
    await this.db
      .delete(followedMerchants)
      .where(
        and(
          eq(followedMerchants.userId, req.userId),
          eq(followedMerchants.merchantId, merchantId),
        ),
      );
  }
}
