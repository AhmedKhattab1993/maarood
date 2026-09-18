import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { users } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { hashPassword, verifyPassword } from '../../auth/password';
import { authSecret, signAuthToken } from '../../auth/token';
import { getEnvConfig } from '../../config/env-store';
import { UserAuthGuard } from '../../auth/user-auth.guard';

const credentials = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(200),
});

interface AuthedRequest {
  userId: string;
}

@Controller('v1/auth')
export class AuthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Post('signup')
  async signup(@Body() body: unknown) {
    const parsed = credentials.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { email, password } = parsed.data;

    const existing = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) throw new ConflictException('Email already registered');

    const passwordHash = await hashPassword(password);
    const [user] = await this.db.insert(users).values({ email, passwordHash }).returning({ id: users.id, email: users.email });
    const token = signAuthToken(user!.id, authSecret(getEnvConfig()));
    return { token, user };
  }

  @Post('login')
  async login(@Body() body: unknown) {
    const parsed = credentials.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { email, password } = parsed.data;

    const rows = await this.db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = signAuthToken(user.id, authSecret(getEnvConfig()));
    return { token, user: { id: user.id, email: user.email } };
  }

  @Get('me')
  @UseGuards(UserAuthGuard)
  async me(@Req() req: AuthedRequest) {
    const rows = await this.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);
    if (rows.length === 0) throw new UnauthorizedException('User not found');
    return { user: rows[0] };
  }
}
