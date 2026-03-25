import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(
    @Inject('TRANSACTION_SERVICE') private transactionClient: ClientProxy,
  ) {}
  private prisma = new PrismaClient();

  //Get Account
  async getAccount(accountNumber: string) {
    const user = await this.prisma.user.findUnique({
      where: { accountNumber },
      include: { account: true },
    });

    if (!user) {
      throw new RpcException('Account not found');
    }

    return {
      name: user.name,
      accountNumber: user.accountNumber,
      balance: user.account.balance,
      accountId: user.account.id,
    };
  }

  //Deposit Money
  async deposit(accountNumber: string, amount: number) {
    if (amount <= 0) {
      throw new RpcException('Amount must be greater than 0');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { user: { accountNumber } },
      });

      if (!account) {
        throw new RpcException('Account not found');
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
        message: `Deposit of ${amount} was successful`,
        balance: updated.balance,
        accountId: account.id,
      };
    });

    //2 Record Trnsaction
    this.transactionClient.emit('create-transaction', {
      type: 'DEPOSIT',
      amount,
      toAccountId: result.accountId,
    });

    return {
      message: result.message,
      balance: result.balance, // for deposit/withdraw
    };
  }

  //Withdraw Money
  async withdraw(accountNumber: string, amount: number) {
    if (amount <= 0) {
      throw new RpcException('Amount must be greater than 0');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { user: { accountNumber } },
      });

      if (!account) {
        throw new RpcException('Account not found');
      }

      if (account.balance < amount) {
        throw new RpcException('Insufficient balance');
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
        message: 'Withdrawal successful',
        balance: updated.balance,
        accountId: account.id,
      };
    });

    //record transaction
    this.transactionClient.emit('create-transaction', {
      type: 'WITHDRAW',
      amount,
      fromAccountId: result.accountId,
    });

    return {
      message: result.message,
      balance: result.balance, // for deposit/withdraw
    };
  }

  //Transfer Money

  async transfer(fromAccount: string, toAccount: string, amount: number) {
    if (amount <= 0) {
      throw new RpcException('Amount must be greater than 0');
    }

    if (fromAccount === toAccount) {
      throw new RpcException('Cannot transfer to same account');
    }

    if (!fromAccount || !toAccount) {
      throw new RpcException('Invalid account details');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      //find sender
      const sender = await tx.account.findFirst({
        where: {
          user: { accountNumber: fromAccount },
        },
      });

      if (!sender) {
        throw new RpcException('Sender account not found');
      }

      // 2. Find Reciver

      const reciever = await tx.account.findFirst({
        where: {
          user: { accountNumber: toAccount },
        },
      });

      if (!reciever) {
        throw new RpcException('Reciever account not found');
      }

      //3. Check Balance
      if (sender.balance < amount) {
        throw new RpcException('Insufficient balance');
      }

      //4. Debit Sender
      await tx.account.update({
        where: { id: sender.id },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      //5. Credit Reciever
      await tx.account.update({
        where: { id: reciever.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return {
        message: `Your transfer of ${amount} to ${toAccount} was successful`,
        fromAccount,
        toAccount,
        amount,
        recieverId: reciever.id,
        senderId: sender.id,
      };
    });

    this.transactionClient.emit('create-transaction', {
      type: 'TRANSFER',
      amount,
      toAccountId: result.recieverId,
      fromAccountId: result.senderId,
    });

    return{
       message: result.message,
       amount,
       fromAccountId: result.senderId,
       toAccountId: result.recieverId,
    }
  }

  async depositFromPayment(email:string, amount:number, reference:string){
        //Check if payment has already been processed
        const existingPayment = await this.prisma.payment.findUnique({
          where:{ reference },
        });

        if(existingPayment && existingPayment.processed){
          throw new RpcException('Payment already processed');
        }

        const result = await this.prisma.$transaction(async (tx) => {
          //find user by email
          const user = await tx.user.findUnique({
            where: { email },
            include: {account : true},
          });

          if(!user){
            throw new RpcException('User not found');
          }

          if(!user.account){
            throw new RpcException('Account not found for this user');
          }

          //Update Account Balance 

          const updatedAccount = await tx.account.update({
            where: { id: user.account.id },
            data: {
              balance:{
                increment:amount,
              },
            },
          });

          //Create or update payment record

          await tx.payment.upsert({
            where: { reference },
            update:{
              processed:true,
              processedAt: new Date(),
              amount,
              status:'success',
            },
            create:{
              reference,
              email,
              amount,
              status: 'success',
              processed:true,
              processedAt: new Date(),
              userId: user.id,
            },
          });

          return{
            message: `Payment of ${amount} was successful`,
            balance: updatedAccount.balance,
            accountId:user.account.id,
            reference,
          }
        });

        //Record Transaction
        this.transactionClient.emit('create-transaction', {
          type: 'DEPOSIT',
          amount,
          toAccountId:result.accountId,
          description: `Paynent via Paystack (Ref: ${reference})`,
        });

        return{
          message: result.message,
          balance: result.balance,
          reference: result.reference,
        }
  }

  

   
}
