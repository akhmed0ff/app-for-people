import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse
        ? (errorResponse as { message: string | string[] }).message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    if (status >= 500) {
      this.logger.error({ err: exception, path: request.url }, 'Unhandled request exception');
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
