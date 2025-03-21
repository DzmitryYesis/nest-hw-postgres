import { Matches } from 'class-validator';
import { IsStringWithTrim, Trim } from '../../../../core';
import {
  emailMatch,
  loginLength,
  loginMatch,
  passwordLength,
} from '../../../../constants';

export class UserInputDto {
  @IsStringWithTrim(loginLength.minLength, loginLength.maxLength)
  @Matches(loginMatch, {
    message:
      'Login can only contain letters, numbers, underscores, and dashes.',
  })
  login: string;

  @IsStringWithTrim(passwordLength.minLength, passwordLength.maxLength)
  password: string;

  @Trim()
  @Matches(emailMatch, {
    message: 'Email contain wrong elements',
  })
  email: string;
}
