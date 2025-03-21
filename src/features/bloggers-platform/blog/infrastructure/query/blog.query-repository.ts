import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain';
import { BlogsQueryParams, BlogViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core/dto';
import { BlogStatusEnum } from '../../../../../constants';
import { ObjectId } from 'mongodb';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async getAllBlogs(
    query: BlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter = {
      blogStatus: { $ne: BlogStatusEnum.DELETED },
    };

    if (query.searchNameTerm) {
      filter['name'] = { $regex: query.searchNameTerm, $options: 'i' };
    }

    const blogs = await this.BlogModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.BlogModel.countDocuments(filter);

    const items = blogs.map(BlogViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getBlogById(id: ObjectId): Promise<BlogViewDto> {
    const blog = await this.BlogModel.findOne({
      _id: id,
      blogStatus: { $ne: BlogStatusEnum.DELETED },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }

    return BlogViewDto.mapToView(blog);
  }
}
