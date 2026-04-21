import { RpcException } from "@nestjs/microservices";

export class RpcCustomException extends RpcException {
  constructor(message: string, statusCode: number) {
    super({
      statusCode,
      message,
    });
  }
}