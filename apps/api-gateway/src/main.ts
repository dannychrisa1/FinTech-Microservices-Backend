import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { RpcHttpExceptionFilter } from '@app/common/filters/rpc-http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  app.useGlobalFilters(new RpcHttpExceptionFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
}
bootstrap();
