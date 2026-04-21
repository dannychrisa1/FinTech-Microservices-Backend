import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { RpcHttpExceptionFilter } from '@app/common/filters/rpc-http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  //Enable CORS for mobile app

  app.enableCors({
    origin: [
      'http://localhost:3000', // Local development
      'http://localhost:8081', // React Native Metro bundler
      'exp://localhost:19000', // Expo local
      'exp://192.168.x.x:19000', // Expo network (replace with your IP)
      /\.fintech-app\.com$/, // Production domain pattern
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  // Add Global Validation Pipe

  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist:true,
  //   forbidNonWhitelisted: true,
  //   transform: true,
  // }))

  app.useGlobalFilters(new RpcHttpExceptionFilter());

  // 🔥 SWAGGER CONFIGURATION
  const config = new DocumentBuilder()
    .setTitle('FinTech Wallet API')
    .setDescription(
      `
      ## Smart Wallet - FinTech Microservices API
      
      This is the API documentation for the Smart Wallet fintech application.
      
      ### Features:
      - 🔐 **Authentication**: JWT-based authentication with OTP email verification
      - 💳 **Payments**: Paystack payment integration
      - 👤 **Account Management**: Balance, deposits, withdrawals, transfers
      - 📊 **Transactions**: Full transaction history with filtering
      - 🔒 **Security**: Passcode protection, account lockout
      
      ### Authentication
      Most endpoints require a Bearer token. Obtain your token by logging in:
      \`POST /auth/login\`
      
      ### Base URL
      \`http://localhost:3000\`
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('account', 'Account management')
    .addTag('transaction', 'Transaction history')
    .addTag('payment', 'Payment processing')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'FinTech Wallet API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Gateway running on port ${port}`);
  console.log(` CORS enabled for mobile app connections`);
  console.log(
    `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
