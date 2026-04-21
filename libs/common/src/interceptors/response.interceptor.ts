import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already an ApiResponse, return it as is
        if (data instanceof ApiResponse) {
          return data;
        }

        // Get the HTTP method to determine appropriate message
        const request = context.switchToHttp().getRequest();
        const method = request.method;

        let message = 'Operation successful';
        if (method === 'POST') message = 'Resource created successfully';
        if (method === 'PUT' || method === 'PATCH') message = 'Resource updated successfully';
        if (method === 'DELETE') message = 'Resource deleted successfully';

        return ApiResponse.success(data, message);
      }),
    );
  }
}