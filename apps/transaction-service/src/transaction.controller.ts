import { Controller, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @EventPattern('create-transaction')
  create(@Payload() data: any){
    return this.transactionService.createTransaction(data)
  }

  @MessagePattern('get-transactions')
  getTransactions(@Payload() payload: {
    accountId:string;
    page?: number;
    limit?: number;
    type?: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
    startDate?: string;
    endDate?: string;
  }){
    return this.transactionService.getTransactions(payload);
  }
 
}
