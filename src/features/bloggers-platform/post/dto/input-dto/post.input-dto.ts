import { IsStringWithTrim } from '../../../../../core';
import {
  postContentLength,
  postShortDescriptionLength,
  postTitleLength,
} from '../../../../../constants/validate';
import { IsMongoId, Validate } from 'class-validator';
import { BlogExistsConstraint } from '../../validators/blog-exist.validator';

export class PostInputDto {
  @IsStringWithTrim(postTitleLength.minLength, postTitleLength.maxLength)
  title: string;

  @IsStringWithTrim(
    postShortDescriptionLength.minLength,
    postShortDescriptionLength.maxLength,
  )
  shortDescription: string;

  @IsStringWithTrim(postContentLength.minLength, postContentLength.maxLength)
  content: string;

  @IsMongoId()
  @Validate(BlogExistsConstraint)
  blogId: string;
}
