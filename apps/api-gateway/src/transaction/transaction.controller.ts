import { GetTransactionsDto } from '@app/common/dto/transaction/get-transactions.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('transaction')
export class TransactionController {
  constructor(
    @Inject('TRANSACTION_SERVICE') private transactionClient: ClientProxy,
    @Inject('ACCOUNT_SERVICE') private accountClient: ClientProxy,
  ) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  async getTransactions(@Body() transactionsDto: GetTransactionsDto) {
    const {
      accountNumber,
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate,
    } = transactionsDto;
    // 1. Get account first
    const account = await lastValueFrom(
      this.accountClient.send('get-account', { accountNumber }),
    );

    // 2. Use accountId to fetch transactions and send enriched query to transaction service
    return await lastValueFrom(
      this.transactionClient.send('get-transactions', {
        accountId: account.accountId,
        page,
        limit,
        type,
        startDate,
        endDate,
      }),
    );
  }
}
