import { GetTransactionsDto } from '@app/common/dto/transaction/get-transactions.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { Request as ExpressRequest } from 'express';
import { JwtPayload } from '../auth/types/jwt-payload.interface';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@ApiTags('transaction')
@ApiBearerAuth('JWT-auth')
@Controller('transaction')
export class TransactionController {
  constructor(
    @Inject('TRANSACTION_SERVICE') private transactionClient: ClientProxy,
    @Inject('ACCOUNT_SERVICE') private accountClient: ClientProxy,
  ) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Retrieves paginated transaction history for the authenticated user with optional filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'],
    description: 'Filter by transaction type',
    example: 'DEPOSIT',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date filter (ISO format)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date filter (ISO format)',
    example: '2026-12-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Transactions retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'uuid-transaction-id' },
                  type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER'] },
                  amount: { type: 'number', example: 5000 },
                  fromAccountId: { type: 'string', nullable: true, example: null },
                  toAccountId: { type: 'string', example: 'uuid-account-id' },
                  description: { type: 'string', nullable: true, example: 'Deposit to account' },
                  createdAt: { type: 'string', example: '2026-04-16T10:00:00.000Z' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 25 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 3 },
              },
            },
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
  async getTransactions(
    @Req() request: RequestWithUser,
    @Query() query: GetTransactionsDto,
  ) {
    const {
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate,
    } = query;
    // 1. Get account first
    const user = request.user as { accountNumber: string; name: string };
    const userAccountNumber = user.accountNumber;
    // Convert page and limit to numbers (they are strings from query)
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const account = await lastValueFrom(
      this.accountClient.send('get-account', {
        accountNumber: userAccountNumber,
      }),
    );

    // 2. Use accountId to fetch transactions and send enriched query to transaction service
    return await lastValueFrom(
      this.transactionClient.send('get-transactions', {
        accountId: account?.data?.accountId,
        page: pageNum,
        limit: limitNum,
        type,
        startDate,
        endDate,
      }),
    );
  }
}
