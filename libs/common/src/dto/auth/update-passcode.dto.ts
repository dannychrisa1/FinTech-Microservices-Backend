import { IsEmail, IsString, Length } from 'class-validator';

export class UpdatePasscodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  oldPasscode: string;

  @IsString()
  @Length(6, 6)
  newPasscode: string;
}
