/**
 * Uniform error shape for all responses:
 *   { error: { code: string, message: string, details?: unknown } }
 *
 * Maps Nest HttpExceptions to their status + message, and unexpected errors
 * to a generic 500 (real error logged, never leaked to the client).
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function statusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'bad_request';
    case HttpStatus.UNAUTHORIZED:
      return 'unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'forbidden';
    case HttpStatus.NOT_FOUND:
      return 'not_found';
    case HttpStatus.CONFLICT:
      return 'conflict';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'validation_error';
    default:
      return status >= 500 ? 'internal_error' : 'error';
  }
}

/** Extract a human message from any HttpException response shape. */
function extractMessage(res: unknown, fallback: string): string {
  if (typeof res === 'string') return res;
  if (res && typeof res === 'object' && 'message' in res) {
    const msg = (res as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  return fallback;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      error: { code: 'internal_error', message: 'An unexpected error occurred.' },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      const message = extractMessage(res, exception.message);
      // For validation-style responses that carry extra fields (e.g. Zod flatten),
      // pass them through as `details` (minus the standard message/error/statusCode keys).
      let details: unknown;
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        const { message: _m, error: _e, statusCode: _s, ...rest } = res as Record<string, unknown>;
        details = Object.keys(rest).length > 0 ? rest : undefined;
      }
      body = {
        error: {
          code: statusToCode(status),
          message,
          ...(details ? { details } : {}),
        },
      };
    } else {
      // Unexpected — log the real error, never send it to the client.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }
}
