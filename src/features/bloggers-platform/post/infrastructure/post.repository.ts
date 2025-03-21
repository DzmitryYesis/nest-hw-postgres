import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain';
import { ObjectId } from 'mongodb';
import { PostStatusEnum } from '../../../../constants';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async findPostById(id: ObjectId): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
      postStatus: { $ne: PostStatusEnum.DELETED },
    });
  }

  async save(post: PostDocument) {
    await post.save();
  }
}
