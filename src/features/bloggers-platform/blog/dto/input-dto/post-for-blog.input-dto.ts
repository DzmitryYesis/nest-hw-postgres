import { IsStringWithTrim } from '../../../../../core';
import {
  postContentLength,
  postShortDescriptionLength,
  postTitleLength,
} from '../../../../../constants/validate';

export class PostForBlogInputDto {
  @IsStringWithTrim(postTitleLength.minLength, postTitleLength.maxLength)
  title: string;

  @IsStringWithTrim(
    postShortDescriptionLength.minLength,
    postShortDescriptionLength.maxLength,
  )
  shortDescription: string;

  @IsStringWithTrim(postContentLength.minLength, postContentLength.maxLength)
  content: string;
}
