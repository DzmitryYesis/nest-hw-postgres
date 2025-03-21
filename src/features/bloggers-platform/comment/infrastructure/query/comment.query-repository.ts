import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain';
import { ObjectId } from 'mongodb';
import { CommentStatusEnum } from '../../../../../constants';
import { CommentsQueryParams, CommentViewDto } from '../../dto';
import { PaginatedViewDto } from '../../../../../core';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
  ) {}

  async getCommentById(id: ObjectId, userId?: string): Promise<CommentViewDto> {
    const comment = await this.CommentModel.findOne({
      _id: id,
      commentStatus: { $ne: CommentStatusEnum.DELETED },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return CommentViewDto.mapToView(comment, userId);
  }

  async getCommentsForPost(
    id: string,
    query: CommentsQueryParams,
    userId?: string,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter = {
      postId: id,
      commentStatus: { $ne: CommentStatusEnum.DELETED },
    };

    const comments = await this.CommentModel.find(filter)
      .sort({
        [query.sortBy]: query.sortDirection,
      })
      .skip((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map((comment) =>
      CommentViewDto.mapToView(comment, userId),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
