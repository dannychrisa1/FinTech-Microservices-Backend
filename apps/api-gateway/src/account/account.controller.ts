import { DepositDto } from '@app/common/dto/deposit/deposit.dto';
import { TransferDto } from '@app/common/dto/transfer/transfer.dto';
import { WithdrawDto } from '@app/common/dto/withdraw/withdraw.dto';
import {
  Body,
  Controller,
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

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@Controller('account')
export class AccountController {
  constructor(
    @Inject('ACCOUNT_SERVICE') private accountClient: ClientProxy,
) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async getAccount(@Req() request: RequestWithUser) {
      const user = request.user as { accountNumber:string; name:string; email:string;}
      const result = await lastValueFrom(this.accountClient.send('get-account', { accountNumber : user.accountNumber}),
    );
    return result;
  }

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async deposit(@Req() request:RequestWithUser, @Body() depositDto: DepositDto) {
    const user = request.user as {accountNumber : string};
    const result = await lastValueFrom(
      this.accountClient.send('deposit', {...depositDto, accountNumber:user.accountNumber}),
    );
    return result;
  }

  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(@Body() withdrawDto: WithdrawDto) {
    const result = await lastValueFrom(
      this.accountClient.send('withdraw', withdrawDto),
    );
    return result;
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transfer(@Body() transferDto: TransferDto) {
      const result = await lastValueFrom(
        this.accountClient.send('transfer', transferDto),
      );
      return result;
  }
}
