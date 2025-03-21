import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BlogRepository } from '../../blog';
import { ObjectId } from 'mongodb';
import { isValidObjectId } from 'mongoose';

@ValidatorConstraint({ async: true })
@Injectable()
export class BlogExistsConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(forwardRef(() => BlogRepository))
    private blogRepository: BlogRepository,
  ) {}

  async validate(blogId: string): Promise<boolean> {
    if (!isValidObjectId(blogId)) {
      return false;
    }

    const blog = await this.blogRepository.findBlogById(new ObjectId(blogId));
    return !!blog;
  }

  defaultMessage(args: ValidationArguments): string {
    return `Blog with id "${args.value}" didn't find`;
  }
}
