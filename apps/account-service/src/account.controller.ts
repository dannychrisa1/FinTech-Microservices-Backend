import { Controller, Get } from '@nestjs/common';
import { AccountService } from './account.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @MessagePattern('get-account')
  getAccount(@Payload() payload: {accountNumber: string}){
    return this.accountService.getAccount(payload.accountNumber);
  }

  @MessagePattern('deposit')
  deposit(@Payload() payload: { accountNumber:string; amount:number}){
    return this.accountService.deposit(payload.accountNumber, payload.amount);

  }

  @MessagePattern('withdraw')
  withdraw(@Payload() payload:{accountNumber:string, amount:number}){
    return this.accountService.withdraw(payload.accountNumber, payload.amount);
  }

  @MessagePattern('transfer')
  transfer(@Payload() payload:{fromAccount:string, toAccount:string, amount:number}){
    return this.accountService.transfer(
      payload.fromAccount,
      payload.toAccount,
      payload.amount,
    )
  }

  @MessagePattern('deposit-from-payment')
  depositFromPayment(@Payload() payload:{email:string; amount: number; reference:string}){
    return this.accountService.depositFromPayment(payload.email, payload.amount, payload.reference);
  }

}
