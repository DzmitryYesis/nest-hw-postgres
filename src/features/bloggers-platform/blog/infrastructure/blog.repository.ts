import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { BlogStatusEnum } from '../../../../constants';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async findBlogById(id: ObjectId): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({
      _id: id,
      blogStatus: { $ne: BlogStatusEnum.DELETED },
    });
  }

  async save(blog: BlogDocument) {
    await blog.save();
  }
}
