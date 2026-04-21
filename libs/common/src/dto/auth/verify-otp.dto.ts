import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example:'user@example.com',
    description:'User email address',
    required:true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example:'123456',
    description:'6 digit OTP code sent to user email',
    minLength:6,
    maxLength:6,
    required:true,
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}