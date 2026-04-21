import { RpcCustomException } from '@app/common';
import { ApiResponse } from '@app/common/dto/api-response.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

@Injectable()
export class AccountService {
  constructor(
    @Inject('TRANSACTION_SERVICE') private transactionClient: ClientProxy,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}
  private prisma = new PrismaClient();

  //Get Account
  async getAccount(accountNumber: string) {
    //Try Cache first
    const cacheKey = `account:${accountNumber}`;
    const cached = await this.redisClient.get(cacheKey);

    if (cached) {
      console.log('Cache hit for account', accountNumber);
      const data = JSON.parse(cached);
      return ApiResponse.success(data, 'Account retrieved successfully');
    }

    console.log('cache miss for account', accountNumber);

    const user = await this.prisma.user.findUnique({
      where: { accountNumber },
      include: { account: true },
    });

    if (!user) {
      throw new RpcCustomException('Account not found', 404);
    }

    const result = {
      name: user.name,
      accountNumber: user.accountNumber,
      balance: user.account.balance,
      accountId: user.account.id,
    };

    //Cache for 5minutes
    await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return ApiResponse.success(result, 'Account retrieved successfully');
  }

  //Deposit Money
  async deposit(accountNumber: string, amount: number) {
    if (amount <= 0) {
      throw new RpcCustomException('Amount must be greater than 0', 400);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { user: { accountNumber } },
      });

      if (!account) {
        throw new RpcCustomException('Account not found', 404);
      }
      //1. Update Balance
      const updated = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return {
        balance: updated.balance,
        accountId: account.id,
        accountNumber: accountNumber,
      };
    });

    // Invalidate cache
    const cacheKey = `account:${accountNumber}`;
    await this.redisClient.del(cacheKey);

    //2 Record Trnsaction
    this.transactionClient.emit('create-transaction', {
      type: 'DEPOSIT',
      amount,
      toAccountId: result.accountId,
      description: `Deposit of ${amount} to account ${accountNumber}`,
    });

    return ApiResponse.success(
      {
        accountNumber: result.accountNumber,
        balance: result.balance,
        amountDeposited: amount,
        transactionType: 'DEPOSIT',
        timestamp: new Date().toISOString(),
      },
      `Deposit of ${amount} was successful`,
    );
  }

  //Withdraw Money
  async withdraw(accountNumber: string, amount: number) {
    if (amount <= 0) {
      throw new RpcCustomException('Amount must be greater than 0', 400);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { user: { accountNumber } },
      });

      if (!account) {
        throw new RpcCustomException('Account not found', 404);
      }

      if (account.balance < amount) {
        throw new RpcCustomException('Insufficient balance', 422);
      }

      const updated = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      return {
        balance: updated.balance,
        accountId: account.id,
        accountNumber: accountNumber,
      };
    });

    // Invalidate cache
    const cacheKey = `account:${accountNumber}`;
    await this.redisClient.del(cacheKey);

    //record transaction
    this.transactionClient.emit('create-transaction', {
      type: 'WITHDRAW',
      amount,
      fromAccountId: result.accountId,
      description: `Withdrawal of ${amount} from account ${accountNumber}`,
    });

    return ApiResponse.success(
      {
        accountNumber: result.accountNumber,
        balance: result.balance,
        amountWithdrawn: amount,
        transactionType: 'WITHDRAWAL',
        timestamp: new Date().toISOString(),
      },
      `Withdrawal of ${amount} was successful`,
    );
  }

  //Transfer Money

  async transfer(fromAccount: string, toAccount: string, amount: number) {
    if (amount <= 0) {
      throw new RpcCustomException('Amount must be greater than 0', 400);
    }

    if (fromAccount === toAccount) {
      throw new RpcCustomException('Cannot transfer to same account', 400);
    }

    if (!fromAccount || !toAccount) {
      throw new RpcCustomException('Invalid account details', 400);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      //find sender
      const sender = await tx.account.findFirst({
        where: {
          user: { accountNumber: fromAccount },
        },
      });

      if (!sender) {
        throw new RpcCustomException('Sender account not found', 404);
      }

      // 2. Find Reciver

      const receiver = await tx.account.findFirst({
        where: {
          user: { accountNumber: toAccount },
        },
      });

      if (!receiver) {
        throw new RpcCustomException('Reciever account not found', 404);
      }

      //3. Check Balance
      if (sender.balance < amount) {
        throw new RpcCustomException('Insufficient balance', 422);
      }

      //4. Debit Sender
      const updatedSender = await tx.account.update({
        where: { id: sender.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      //5. Credit Reciever
      const updatedReceiver = await tx.account.update({
        where: { id: receiver.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return {
        fromBalance: updatedSender.balance,
        toBalance: updatedReceiver.balance,
        fromAccountId: sender.id,
        toAccountId: receiver.id,
        fromAccountNumber: fromAccount,
        toAccountNumber: toAccount,
        amount: amount,
      };
    });

    // Invalidate cache for both sender and receiver
    const senderCacheKey = `account:${fromAccount}`;
    const receiverCacheKey = `account:${toAccount}`;
    await this.redisClient.del(senderCacheKey);
    await this.redisClient.del(receiverCacheKey);

    this.transactionClient.emit('create-transaction', {
      type: 'TRANSFER',
      amount,
      toAccountId: result.toAccountId,
      fromAccountId: result.fromAccountId,
    });

    return ApiResponse.success(
      {
        fromAccount: result.fromAccountNumber,
        toAccount: result.toAccountNumber,
        amount: result.amount,
        fromBalance: result.fromBalance,
        toBalance: result.toBalance,
        transactionType: 'TRANSFER',
        timestamp: new Date().toISOString(),
      },
      `Transfer of ${amount} to account ${toAccount} was successful`,
    );
  }

  async depositFromPayment(email: string, amount: number, reference: string) {
    //Check if payment has already been processed
    const existingPayment = await this.prisma.payment.findUnique({
      where: { reference },
    });

    if (existingPayment && existingPayment.processed) {
      throw new RpcCustomException('Payment already processed', 409);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      //find user by email
      const user = await tx.user.findUnique({
        where: { email },
        include: { account: true },
      });

      if (!user) {
        throw new RpcCustomException('User not found', 404);
      }

      if (!user.account) {
        throw new RpcCustomException('Account not found for this user', 404);
      }

      //Update Account Balance

      const updatedAccount = await tx.account.update({
        where: { id: user.account.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      //Create or update payment record

      await tx.payment.upsert({
        where: { reference },
        update: {
          processed: true,
          processedAt: new Date(),
          amount,
          status: 'success',
        },
        create: {
          reference,
          email,
          amount,
          status: 'success',
          processed: true,
          processedAt: new Date(),
          userId: user.id,
        },
      });

      return {
        balance: updatedAccount.balance,
        accountId: user.account.id,
        accountNumber: user.accountNumber,
        reference,
        email: user.email,
        name: user.name,
      };
    });

    //INVALIDATE CACHE (CLEAR OLD BABLANCE)
    const cacheKey = `account:${result.accountNumber}`;
    await this.redisClient.del(cacheKey);
    console.log(`Cache invalidated for account: ${result.accountNumber}`);

    console.log(
      '📤 Emitting create-transaction with data:',
      JSON.stringify({
        type: 'DEPOSIT',
        amount,
        toAccountId: result.accountId,
        description: `Payment via Paystack (Ref: ${reference})`,
      }),
    );

    //Record Transaction
    this.transactionClient.emit('create-transaction', {
      type: 'DEPOSIT',
      amount,
      toAccountId: result.accountId,
      description: `Paynent via Paystack (Ref: ${reference})`,
    });

    return ApiResponse.success(
      {
        email: result.email,
        name: result.name,
        accountNumber: result.accountNumber,
        balance: result.balance,
        amountDeposited: amount,
        reference: result.reference,
        transactionType: 'DEPOSIT',
        timestamp: new Date().toISOString(),
      },
      `Payment of ${amount} was successful`,
    );
  }
}
