import { IsStringWithTrim, Trim } from '../../../../../core';
import {
  blogDescriptionLength,
  blogNameLength,
  blogWebsiteUrlLength,
  websiteUrlMatch,
} from '../../../../../constants/validate';
import { Matches } from 'class-validator';

export class BlogInputDto {
  @IsStringWithTrim(blogNameLength.minLength, blogNameLength.maxLength)
  name: string;

  @IsStringWithTrim(
    blogDescriptionLength.minLength,
    blogDescriptionLength.maxLength,
  )
  description: string;

  @IsStringWithTrim(
    blogWebsiteUrlLength.minLength,
    blogWebsiteUrlLength.maxLength,
  )
  @Trim()
  @Matches(websiteUrlMatch, {
    message: 'WebsiteUrl contain wrong elements',
  })
  websiteUrl: string;
}
