export class ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;

  constructor(status: 'success' | 'error', message: string, data?: T, error?: string) {
    this.status = status;
    this.message = message;
    if (data !== undefined) this.data = data;
    if (error) this.error = error;
  }

  static success<T>(data: T, message = 'Operation successful'): ApiResponse<T> {
    return new ApiResponse('success', message, data);
  }

  static error(message: string, error?: string): ApiResponse<null> {
    return new ApiResponse('error', message, null, error);
  }
}