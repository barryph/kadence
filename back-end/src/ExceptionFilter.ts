import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import ServerError from './shared/ServerError';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Expected errors
    if (exception instanceof ServerError) {
      response.status(exception.httpStatus).json({
        error: {
          code: exception.code,
          message: exception.message,
        },
      });
      return;
    }

    this.logger.error('Unexpected exception occured:', exception);
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(httpStatus).json({
      error: {
        statusCode: httpStatus,
        message: 'Internal server error',
      },
    });
  }
}
