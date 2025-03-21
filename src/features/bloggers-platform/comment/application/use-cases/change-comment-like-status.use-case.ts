import { ObjectId } from 'mongodb';
import { BaseLikeStatusInputDto } from '../../../../../core/dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure';
import { UsersRepository } from '../../../../user-accounts';
import { NotFoundException } from '@nestjs/common';
import { BaseLikesDislikesDBData } from '../../../../../core';
import { UserLikeStatus } from '../../../../../constants';

export class ChangeCommentLikeStatusCommand {
  constructor(
    public userId: string,
    public id: ObjectId,
    public data: BaseLikeStatusInputDto,
  ) {}
}

@CommandHandler(ChangeCommentLikeStatusCommand)
export class ChangeCommentLikeStatusUseCase
  implements ICommandHandler<ChangeCommentLikeStatusCommand>
{
  constructor(
    private commentRepository: CommentRepository,
    private userRepository: UsersRepository,
  ) {}

  async execute(command: ChangeCommentLikeStatusCommand): Promise<void> {
    const {
      id,
      userId,
      data: { likeStatus },
    } = command;

    const comment = await this.commentRepository.findCommentById(id);

    if (!comment) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Comment with id ${id} not found`,
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

    const likesArr = comment.likesInfo.likes.map((l) => l.userId);
    const dislikesArr = comment.likesInfo.dislikes.map((d) => d.userId);
    const likeOrDislikeInfo = {
      userId: userId,
      login: user.login,
      addedAt: new Date(),
    } as BaseLikesDislikesDBData;

    if (likeStatus === UserLikeStatus.LIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        comment.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
      if (!likesArr.includes(userId) && dislikesArr.includes(userId)) {
        comment.deleteLikeOrDislike('dislikes', userId);
        comment.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
    }

    if (likeStatus === UserLikeStatus.DISLIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        comment.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
      if (likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        comment.deleteLikeOrDislike('likes', userId);
        comment.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
    }

    if (likeStatus === UserLikeStatus.NONE) {
      if (likesArr.includes(userId)) {
        comment.deleteLikeOrDislike('likes', userId);
      }

      if (dislikesArr.includes(userId)) {
        comment.deleteLikeOrDislike('dislikes', userId);
      }
    }

    await this.commentRepository.save(comment);
  }
}
