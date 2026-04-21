import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: '0943654321',
    description: 'Recipient account number (10 digits)',
    required: true,
  })
  @IsString()
  toAccount: string;

  @ApiProperty({
    example: 5000,
    description: 'Amount to transfer in NGN',
    minimum: 1,
    required: true,
  })
  @IsNumber()
  @Min(1)
  amount: number;
}
