import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6 digit OTP code sent to user email',
    minLength: 6,
    maxLength: 6,
    required: true,
  })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ example: 'password123', description: 'New Password' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
