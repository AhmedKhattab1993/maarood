import { BadRequestException, Body, Controller, Header, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';
import { authSecret, verifyAuthToken } from '../../auth/token';
import { getEnvConfig } from '../../config/env-store';
import type { PaginatedResult, PublicProduct } from '../products/product-mapper';
import { feedRequest } from './feed.dto';
import { FeedService } from './feed.service';

@Controller('v1/feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Post()
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  async discover(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ): Promise<PaginatedResult<PublicProduct>> {
    const parsed = feedRequest.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    let userId: string | null = null;
    if (authorization !== undefined) {
      if (!authorization.startsWith('Bearer ')) throw new UnauthorizedException('Invalid bearer token.');
      const token = verifyAuthToken(authorization.slice(7).trim(), authSecret(getEnvConfig()));
      if (!token || !z.string().uuid().safeParse(token.userId).success) {
        throw new UnauthorizedException('Invalid bearer token.');
      }
      userId = token.userId;
    }
    return this.feed.discover(parsed.data, userId);
  }
}
