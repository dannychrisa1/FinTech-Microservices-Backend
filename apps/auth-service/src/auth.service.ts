import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  async register(name:string, email:string, password:string){
    //Hast the Pssword
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a random account number

    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    //Save user in DB

    const user = await this.prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword,
        accountNumber,
        account:{
          create:{ balance: 0},
        },     
      },
      include: {account : true},
    });

    return{
       message: 'User registered succesfully',
       data:{
        name:user.name,
        email:user.email,
        accountNumber:user.accountNumber,
        balance:user.account.balance,
       }
    }
  }

  async login(email:string, password:string){
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {account: true},
    });
if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new RpcException('Account number or password is incorrect');
    }

    return{
      message: 'Login successful',
      data:{
        name:user.name,
        email:user.email,
        accountNumber:user.accountNumber,
        balance:user.account.balance,
      },
    };
  }
}
