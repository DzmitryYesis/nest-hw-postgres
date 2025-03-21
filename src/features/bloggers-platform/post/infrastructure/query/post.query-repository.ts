import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain';
import { ObjectId } from 'mongodb';
import { PostStatusEnum } from '../../../../../constants';
import { PostsQueryParams, PostViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async getAllPosts(
    query: PostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter = {
      postsStatus: { $ne: PostStatusEnum.DELETED },
    };

    const posts = await this.PostModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((post) => PostViewDto.mapToView(post, userId));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getPostById(id: ObjectId, userId?: string): Promise<PostViewDto> {
    const post = await this.PostModel.findOne({
      _id: id,
      postStatus: { $ne: PostStatusEnum.DELETED },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return PostViewDto.mapToView(post, userId);
  }

  async getPostsForBlog(
    id: string,
    query: PostsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter = {
      blogId: id,
      postsStatus: { $ne: PostStatusEnum.DELETED },
    };

    const posts = await this.PostModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = posts.map((post) => PostViewDto.mapToView(post, userId));

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
