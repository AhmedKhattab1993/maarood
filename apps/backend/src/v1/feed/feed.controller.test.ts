import 'reflect-metadata';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { HEADERS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signAuthToken } from '../../auth/token';
import { setEnvConfig } from '../../config/env-store';
import { FeedController } from './feed.controller';
import type { FeedService } from './feed.service';

const SECRET = 'feed-tests-secret-123456';
const USER = '11111111-1111-4111-8111-111111111111';

describe('feed optional identity', () => {
  const discover = vi.fn().mockResolvedValue({ items: [], page: 1, limit: 24, total: 0 });
  const controller = new FeedController({ discover } as unknown as FeedService);

  beforeEach(() => {
    discover.mockClear();
    setEnvConfig({
      NODE_ENV: 'test', PORT: 8080, DATABASE_URL: 'postgresql://unused',
      ADMIN_TOKEN: SECRET, CORS_ORIGIN: '*',
    });
  });

  it('serves anonymous preferences without requiring account state', async () => {
    await controller.discover({ seed: 'visit', profile: { categories: { apparel: 3 } } });
    expect(discover).toHaveBeenCalledWith(expect.objectContaining({
      profile: { categories: { apparel: 3 }, merchants: {} },
    }), null);
  });

  it('passes only a cryptographically verified account ID to the service', async () => {
    await controller.discover({ seed: 'visit' }, `Bearer ${signAuthToken(USER, SECRET)}`);
    expect(discover).toHaveBeenCalledWith(expect.anything(), USER);
  });

  it('rejects forged, expired, wrong-scheme and invalid-identity tokens before querying preferences', async () => {
    const expired = signAuthToken(USER, SECRET, Math.floor(Date.now() / 1000) - 31 * 86400);
    for (const header of [
      `Bearer ${signAuthToken(USER, 'wrong-secret')}`, `Bearer ${expired}`, 'Basic anything',
      `Bearer ${signAuthToken('not-a-uuid', SECRET)}`,
    ]) {
      await expect(controller.discover({ seed: 'visit' }, header)).rejects.toBeInstanceOf(UnauthorizedException);
    }
    expect(discover).not.toHaveBeenCalled();
  });

  it('rejects identity injection and malformed input without database work', async () => {
    await expect(controller.discover({ seed: 'visit', userId: USER })).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.discover({ seed: 'visit', limit: 1000 })).rejects.toBeInstanceOf(BadRequestException);
    expect(discover).not.toHaveBeenCalled();
  });

  it('marks the read-only POST response private and uncacheable', () => {
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, FeedController.prototype.discover)).toBe(200);
    expect(Reflect.getMetadata(HEADERS_METADATA, FeedController.prototype.discover))
      .toContainEqual({ name: 'Cache-Control', value: 'private, no-store' });
  });
});
