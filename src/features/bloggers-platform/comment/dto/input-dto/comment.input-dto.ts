import { commentContentLength } from '../../../../../constants/validate';
import { IsStringWithTrim } from '../../../../../core';

export class CommentInputDto {
  @IsStringWithTrim(
    commentContentLength.minLength,
    commentContentLength.maxLength,
  )
  content: string;
}
