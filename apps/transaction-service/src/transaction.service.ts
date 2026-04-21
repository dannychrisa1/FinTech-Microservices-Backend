import { ApiResponse } from '@app/common/dto/api-response.dto';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TransactionService {
  private prisma = new PrismaClient();

  async createTransaction(data: {
    type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
    amount: number;
    fromAccountId?: string;
    toAccountId?: string;
    description?: string;
  }) {
    const transaction = await this.prisma.transaction.create({ 
       data: {
          type: data.type,
          amount: data.amount,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          description: data?.description, 
        }
    });

    let message = '';
    switch (data.type) {
      case 'DEPOSIT':
        message = `Deposit of ${data.amount} was recorded successfully`;
        break;
      case 'WITHDRAW':
        message = `Withdrawal of ${data.amount} was recorded successfully`;
        break;
      case 'TRANSFER':
        message = `Transfer of ${data.amount} was recorded successfully`;
        break;
    }
     return ApiResponse.success(transaction, message);
  }

  async getTransactions(payload: {
    accountId: string;
    page?: number;
    limit?: number;
    type?: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
    startDate?: string;
    endDate?: string;
  }) {
    const {
      accountId,
      page = 1,
      limit = 10,
      type,
      startDate,
      endDate,
    } = payload;

    // Ensure numbers (in case they come as strings)
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      ...(type && { type }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return ApiResponse.success(
      {
        transactions,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limit),
        },
      },
      'Transactions retrieved successfully'
    );
   
  }
}
