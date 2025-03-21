import { Trim } from '../../../../core';
import { Matches } from 'class-validator';
import { emailMatch } from '../../../../constants';

export class PasswordRecoveryInputDto {
  @Trim()
  @Matches(emailMatch, {
    message: 'Email contain wrong elements',
  })
  email: string;
}
