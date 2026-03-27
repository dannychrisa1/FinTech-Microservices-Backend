import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { RpcHttpExceptionFilter } from '@app/common/filters/rpc-http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  //Enable CORS for mobile app

  app.enableCors({
    origin:[
        'http://localhost:3000',           // Local development
        'http://localhost:8081',           // React Native Metro bundler
        'exp://localhost:19000',           // Expo local
         'exp://192.168.x.x:19000',         // Expo network (replace with your IP)
          /\.fintech-app\.com$/,              // Production domain pattern
    ],
    methods:['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials:true,
    allowedHeaders:[
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
  });

  // Add Global Validation Pipe

  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  app.useGlobalFilters(new RpcHttpExceptionFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway running on port ${port}`);
  console.log(` CORS enabled for mobile app connections`);
}
bootstrap();
