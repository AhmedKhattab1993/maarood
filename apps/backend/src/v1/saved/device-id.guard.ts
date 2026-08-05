/**
 * Extracts and validates the X-Device-Id header for saved-product routes.
 * The device id is a client-generated UUID (localStorage); no server session.
 *
 * Implemented as a NestJS guard so it can decorate the saved controller.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

@Injectable()
export class DeviceIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const deviceId = request.headers['x-device-id'];
    const parsed = uuidSchema.safeParse(deviceId);
    if (!parsed.success) {
      throw new BadRequestException('Valid X-Device-Id header (UUID) is required.');
    }
    request.deviceId = parsed.data;
    return true;
  }
}
