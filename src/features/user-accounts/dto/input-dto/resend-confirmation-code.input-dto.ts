import { Trim } from '../../../../core';
import { Matches } from 'class-validator';
import { emailMatch } from '../../../../constants';

export class ResendConfirmationCodeInputDto {
  @Trim()
  @Matches(emailMatch, {
    message: 'Email contain wrong elements',
  })
  email: string;
}
