import { IsStringWithTrim, Trim } from '../../../../core';
import { passwordLength } from '../../../../constants';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginInputDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  loginOrEmail: string;

  @IsStringWithTrim(passwordLength.minLength, passwordLength.maxLength)
  password: string;
}
