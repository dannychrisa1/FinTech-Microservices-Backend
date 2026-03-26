import { IsEmail, IsString, Length } from 'class-validator';

export class LoginWithPasscodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  passcode: string;
}
