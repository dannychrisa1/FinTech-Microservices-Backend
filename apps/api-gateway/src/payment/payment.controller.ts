import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request as ExpressRequest } from 'express';
import { lastValueFrom } from 'rxjs';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { JwtPayload } from '../auth/types/jwt-payload.interface';
import { userInfo } from 'os';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@ApiTags('payment')
@ApiBearerAuth('JWT-auth')
@Controller('payment')
export class PaymentController {
  constructor(@Inject('PAYMENT_SERVICE') private paymentClient: ClientProxy) {}

  //Initialize a Payment (get payStack authorization URL)
  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Initialize payment',
    description:
      'Initializes a Paystack payment transaction and returns authorization URL',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 5000,
          description: 'Amount to deposit in NGN',
          minimum: 1,
        },
      },
      required: ['amount'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment initialized successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example: 'Payment initialized successfully',
        },
        data: {
          type: 'object',
          properties: {
            authorizationUrl: {
              type: 'string',
              example: 'https://checkout.paystack.com/xxx',
            },
            reference: { type: 'string', example: 'txn_1234567890' },
            accessCode: { type: 'string', example: 'xxx' },
            email: { type: 'string', example: 'user@example.com' },
            amount: { type: 'number', example: 5000 },
            currency: { type: 'string', example: 'NGN' },
            expiresIn: { type: 'number', example: 3600 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount or missing email',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 502,
    description: 'Paystack service error',
  })
  @ApiResponse({
    status: 504,
    description: 'Payment service timeout',
  })
  async initializePayment(
    @Req() request: RequestWithUser,
    @Body() body: { amount: number },
  ) {
    const user = request.user as {
      email: string;
      accountNumber: string;
      name: string;
    };
    const result = await lastValueFrom(
      this.paymentClient.send('initialize-payment', {
        email: user.email,
        amount: body.amount,
      }),
    );
    return result;
  }

  //Verify Payment after users complets payment on paystack

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Verify payment',
    description:
      'Verifies a completed Paystack payment and deposits funds to user account',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reference: {
          type: 'string',
          example: 'txn_1234567890',
          description: 'Payment reference from initialize endpoint',
        },
      },
      required: ['reference'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified and deposited successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example: 'Payment verified and deposited successfully',
        },
        data: {
          type: 'object',
          properties: {
            paymentReference: { type: 'string', example: 'txn_1234567890' },
            transactionStatus: { type: 'string', example: 'success' },
            paymentMethod: { type: 'string', example: 'card' },
            amountPaid: { type: 'number', example: 5000 },
            currency: { type: 'string', example: 'NGN' },
            customer: {
              type: 'object',
              properties: {
                email: { type: 'string', example: 'user@example.com' },
                name: { type: 'string', example: 'John Doe' },
              },
            },
            depositDetails: {
              type: 'object',
              properties: {
                accountNumber: { type: 'string', example: '1234567890' },
                balance: { type: 'number', example: 55000 },
                amountDeposited: { type: 'number', example: 5000 },
              },
            },
            paidAt: { type: 'string', example: '2026-04-16T10:00:00.000Z' },
            transactionDate: {
              type: 'string',
              example: '2026-04-16T10:05:00.000Z',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid reference, payment verification failed, or expired OTP',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Payment does not belong to this user',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment reference not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Payment already processed',
  })
  @ApiResponse({
    status: 502,
    description: 'Paystack service error',
  })
  @ApiResponse({
    status: 504,
    description: 'Payment verification timeout',
  })
  async verifyPayment(
    @Req() request: RequestWithUser,
    @Body() body: { reference: string },
  ) {
    const user = request.user as { email: string };
    const result = await lastValueFrom(
      this.paymentClient.send('verify-payment', {
        reference: body.reference,
        email: user.email,
      }),
    );
    return result;
  }

  //Webhook Endpoint

  // @Post('webhook')
  // @HttpCode(HttpStatus.OK)
  // async handleWebhook(@Body() body:any, @Headers('x-paystack-signature') signature:string){
  //     //Verify webhook signature(importand for security)
  //     const crypto = require('crypto');
  //     const secret = process.env.PAYSTACK_SECRET;
  //     const hash = crypto
  //         .createHmac('sha512', secret)
  //         .update(JSON.stringify(body))
  //         .digest('hex');

  //         if (hash !== signature){
  //             return { status:'error', message:'Invalid signature'}
  //         }

  //         //Handle Charge.success event
  //         if(body.event === 'charge.success'){

  //             const reference = body.data.reference;

  //             //Process the payment throuh microservice
  //             const result = await lastValueFrom(
  //                 this.paymentClient.send('handle-payment-webhook', {
  //                     reference
  //                 }),
  //             );

  //             return result;
  //         }

  //         return { status: 'recieved'};
  // }
}
