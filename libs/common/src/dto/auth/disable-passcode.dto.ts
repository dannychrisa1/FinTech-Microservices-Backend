import { IsEmail, IsString, Length } from 'class-validator';

export class DisablePasscodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  passcode: string;
}
