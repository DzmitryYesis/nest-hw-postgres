import { Injectable } from '@nestjs/common';
import { Comment, CommentDocument, CommentModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { CommentStatusEnum } from '../../../../constants';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
  ) {}

  async findCommentById(id: ObjectId): Promise<CommentDocument | null> {
    return this.CommentModel.findOne({
      _id: id,
      commentStatus: { $ne: CommentStatusEnum.DELETED },
    });
  }

  async save(comment: CommentDocument): Promise<void> {
    await comment.save();
  }
}
