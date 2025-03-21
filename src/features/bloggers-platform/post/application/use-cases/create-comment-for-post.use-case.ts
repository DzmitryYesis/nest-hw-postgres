import { ObjectId } from 'mongodb';
import {
  Comment,
  CommentInputDto,
  CommentModelType,
  CommentRepository,
} from '../../../comment';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../../../../user-accounts';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';

export class CreateCommentForPostCommand {
  constructor(
    public id: ObjectId,
    public userId: string,
    public dto: CommentInputDto,
  ) {}
}

//TODO refactoring duplicate code
@CommandHandler(CreateCommentForPostCommand)
export class CreateCommentForPostUseCase
  implements ICommandHandler<CreateCommentForPostCommand>
{
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private userRepository: UsersRepository,
    private postRepository: PostRepository,
    private commentRepository: CommentRepository,
  ) {}

  async execute(command: CreateCommentForPostCommand): Promise<ObjectId> {
    const {
      userId,
      id,
      dto: { content },
    } = command;

    const post = await this.postRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Post with id ${id} not found`,
          },
        ],
      });
    }

    const user = await this.userRepository.findByCredentials(
      '_id',
      new ObjectId(userId),
    );

    if (!user) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `User with id ${id} not found`,
          },
        ],
      });
    }

    const comment = this.CommentModel.createInstance({
      postId: post.id,
      content,
      userId: userId,
      userLogin: user.login,
    });

    await this.commentRepository.save(comment);

    return comment._id;
  }
}
