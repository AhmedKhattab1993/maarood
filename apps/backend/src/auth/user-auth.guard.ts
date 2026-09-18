import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getEnvConfig } from '../config/env-store';
import { authSecret, verifyAuthToken } from './token';

@Injectable()
export class UserAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    const token = header.slice('Bearer '.length).trim();
    const parsed = verifyAuthToken(token, authSecret(getEnvConfig()));
    if (!parsed) throw new UnauthorizedException('Invalid token.');
    request.userId = parsed.userId;
    return true;
  }
}
