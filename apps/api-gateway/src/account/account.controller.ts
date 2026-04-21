import { DepositDto } from '@app/common/dto/deposit/deposit.dto';
import { TransferDto } from '@app/common/dto/transfer/transfer.dto';
import { WithdrawDto } from '@app/common/dto/withdraw/withdraw.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Request as ExpressRequest } from 'express';
import { JwtPayload } from '../auth/types/jwt-payload.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@ApiTags('account')
@ApiBearerAuth('JWT-auth')
@Controller('account')
export class AccountController {
  constructor(@Inject('ACCOUNT_SERVICE') private accountClient: ClientProxy) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Get account details',
    description:
      'Retrieves the authenticated user account information including balance and account number',
  })
  @ApiResponse({
    status: 200,
    description: 'Account details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Account retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            accountNumber: { type: 'string', example: '1234567890' },
            balance: { type: 'number', example: 50000 },
            accountId: { type: 'string', example: 'uuid-account-id' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async getAccount(@Req() request: RequestWithUser) {
    const user = request.user as {
      accountNumber: string;
      name: string;
      email: string;
    };
    const result = await lastValueFrom(
      this.accountClient.send('get-account', {
        accountNumber: user.accountNumber,
      }),
    );
    return result;
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Deposit money',
    description: "Adds funds to the authenticated user's account",
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Deposit of 5000 was successful' },
        data: {
          type: 'object',
          properties: {
            accountNumber: { type: 'string', example: '1234567890' },
            balance: { type: 'number', example: 55000 },
            amountDeposited: { type: 'number', example: 5000 },
            transactionType: { type: 'string', example: 'DEPOSIT' },
            timestamp: { type: 'string', example: '2026-04-16T10:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount (amount must be greater than 0)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async deposit(
    @Req() request: RequestWithUser,
    @Body() depositDto: DepositDto,
  ) {
    const user = request.user as { accountNumber: string };
    const result = await lastValueFrom(
      this.accountClient.send('deposit', {
        accountNumber: user.accountNumber,
        amount: depositDto.amount,
      }),
    );
    return result;
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Withdraw money',
    description: "Withdraws funds from the authenticated user's account",
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example: 'Withdrawal of 5000 was successful',
        },
        data: {
          type: 'object',
          properties: {
            accountNumber: { type: 'string', example: '1234567890' },
            balance: { type: 'number', example: 45000 },
            amountWithdrawn: { type: 'number', example: 5000 },
            transactionType: { type: 'string', example: 'WITHDRAWAL' },
            timestamp: { type: 'string', example: '2026-04-16T10:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount or insufficient balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  @ApiResponse({
    status: 422,
    description: 'Insufficient balance for withdrawal',
  })
  async withdraw(
    @Req() request: RequestWithUser,
    @Body() withdrawDto: WithdrawDto,
  ) {
    const user = request.user as { accountNumber: string };
    const result = await lastValueFrom(
      this.accountClient.send('withdraw', {
        accountNumber: user.accountNumber,
        amount: withdrawDto.amount,
      }),
    );
    return result;
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Transfer money',
    description:
      "Transfers funds from authenticated user's account to another account",
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer successful',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example: 'Transfer of 5000 to account 0987654321 was successful',
        },
        data: {
          type: 'object',
          properties: {
            fromAccount: { type: 'string', example: '1234567890' },
            toAccount: { type: 'string', example: '0987654321' },
            amount: { type: 'number', example: 5000 },
            fromBalance: { type: 'number', example: 45000 },
            toBalance: { type: 'number', example: 55000 },
            transactionType: { type: 'string', example: 'TRANSFER' },
            timestamp: { type: 'string', example: '2026-04-16T10:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid amount, same account transfer, or missing account details',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Sender or receiver account not found',
  })
  @ApiResponse({
    status: 422,
    description: 'Insufficient balance for transfer',
  })
  async transfer(
    @Req() request: RequestWithUser,
    @Body() transferDto: TransferDto,
  ) {
    const user = request.user as {
      accountNumber: string;
      name: string;
      email: string;
    };
    const result = await lastValueFrom(
      this.accountClient.send('transfer', {
        fromAccount: user.accountNumber,
        toAccount: transferDto.toAccount,
        amount: transferDto.amount,
      }),
    );
    return result;
  }
}
