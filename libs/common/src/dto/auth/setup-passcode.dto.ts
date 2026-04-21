import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class SetupPasscodeDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: true,
  })
  @IsEmail()
  email: string;

   @ApiProperty({
    example:'123456',
    description:'Create 6 digit passcode',
    minLength:6,
    maxLength:6,
    required:true,
  })
  @IsString()
  @Length(6, 6)
  passcode: string;
}
