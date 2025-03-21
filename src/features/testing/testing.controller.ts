import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogModelType,
  Comment,
  CommentModelType,
  Post,
  PostModelType,
} from '../bloggers-platform';
import { User, UserModelType } from '../user-accounts';
import { DELETE_ALL_API_PATH } from '../../constants';
import {
  Session,
  SessionModelType,
} from '../user-accounts/domain/session.entity';

@Controller(DELETE_ALL_API_PATH.ROOT_URL)
export class TestingController {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(Session.name)
    private SessionModel: SessionModelType,
  ) {}

  @Delete(DELETE_ALL_API_PATH.DELETE_ALL_DATA)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await this.UserModel.deleteMany({});
    await this.BlogModel.deleteMany({});
    await this.PostModel.deleteMany({});
    await this.CommentModel.deleteMany({});
    await this.SessionModel.deleteMany({});
    return;
  }
}
