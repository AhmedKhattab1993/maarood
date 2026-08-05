/**
 * Guard for all /admin/* routes — single shared-secret bearer token.
 * Compares Authorization: Bearer <token> against ADMIN_TOKEN in constant time.
 * No users, no DB, no JWT — one server-side secret rotated via env.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { getEnvConfig } from '../config/env-store';

function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    const token = authHeader.slice('Bearer '.length).trim();
    const expected = getEnvConfig().ADMIN_TOKEN;
    if (!token || !tokensMatch(token, expected)) {
      throw new UnauthorizedException('Invalid token.');
    }
    return true;
  }
}
