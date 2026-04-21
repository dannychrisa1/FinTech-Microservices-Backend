import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  ExceptionFilter,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';

@Catch()
export class RpcHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception?.statusCode) {
      status = exception.statusCode;
      message = exception.message;
    } else if (exception?.response?.statusCode) {
      status = exception.response.statusCode;
      message = exception.response.message;
    } else if (typeof exception?.message === 'object') {
      status = exception.message.statusCode || HttpStatus.BAD_REQUEST;
      message = exception.message.message || 'An error occurred';
    } else if (typeof exception?.message === 'string') {
      message = exception.message;
      status = HttpStatus.BAD_REQUEST;
    }

    response.status(status).json({
      status: 'error',
      message,
      data: null,
    });
  }
}