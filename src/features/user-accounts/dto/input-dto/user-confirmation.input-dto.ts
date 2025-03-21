import { Trim } from '../../../../core';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserConfirmationInputDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  code: string;
}
