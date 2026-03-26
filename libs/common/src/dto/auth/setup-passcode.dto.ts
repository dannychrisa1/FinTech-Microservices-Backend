import { IsEmail, IsString, Length } from 'class-validator';

export class SetupPasscodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  passcode: string;
}
