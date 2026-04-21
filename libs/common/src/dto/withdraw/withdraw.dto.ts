import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
export class WithdrawDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount to withdraw in NGN',
    minimum: 1,
    required: true,
  })
  @IsNumber()
  @Min(1)
  amount: number;
}
