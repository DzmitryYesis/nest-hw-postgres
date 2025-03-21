import { IsStringWithTrim, Trim } from '../../../../core';
import { IsNotEmpty, IsString } from 'class-validator';
import { passwordLength } from '../../../../constants';

export class ChangePasswordInputDto {
  @IsStringWithTrim(passwordLength.minLength, passwordLength.maxLength)
  newPassword: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;
}
