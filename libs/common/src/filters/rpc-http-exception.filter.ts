import { Catch, ArgumentsHost, HttpStatus, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class RpcHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';

    console.log('Exception caught in filter:', exception); // For debugging

    // Check if it's an RpcException
    if (exception instanceof RpcException) {
      const error = exception.getError();
      status = HttpStatus.BAD_REQUEST;
      
      // Handle both string and object error types
      if (typeof error === 'string') {
        message = error;
      } else if (error && typeof error === 'object') {
        // If it's an object, try to extract a meaningful message
        message = (error as any).message || JSON.stringify(error);
      }
    } 
    // Handle the error from the microservice client
    else if (exception.name === 'RpcException' || exception.message?.includes('RpcException')) {
      status = HttpStatus.BAD_REQUEST;
      
      // Try to extract the actual error message
      try {
        // Sometimes the error message is stringified
        const errorObj = JSON.parse(exception.message);
        message = errorObj.message || errorObj.error || exception.message;
      } catch {
        // If it's not JSON, check if it's the error object
        if (exception.response) {
          message = exception.response.message || exception.response.error || exception.message;
        } else {
          message = exception.message;
        }
      }
    }
    // Handle other types of errors
    else if (exception.message) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}