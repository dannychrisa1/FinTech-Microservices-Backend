import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TransactionService {
  private prisma = new PrismaClient();

  async createTransaction(data: {
    type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
    amount: number;
    fromAccountId?: string;
    toAccountId?: string;
  }) {
    return this.prisma.transaction.create({ data });
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

    const skip = (page - 1) * limit;

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
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
