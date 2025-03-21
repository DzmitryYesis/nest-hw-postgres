import { ObjectId } from 'mongodb';
import { BaseLikeStatusInputDto } from '../../../../../core/dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../../../user-accounts';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';
import { BaseLikesDislikesDBData } from '../../../../../core';
import { UserLikeStatus } from '../../../../../constants';

export class ChangePostLikeStatusCommand {
  constructor(
    public userId: string,
    public id: ObjectId,
    public data: BaseLikeStatusInputDto,
  ) {}
}

@CommandHandler(ChangePostLikeStatusCommand)
export class ChangePostLikeStatusUseCase
  implements ICommandHandler<ChangePostLikeStatusCommand>
{
  constructor(
    private userRepository: UsersRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: ChangePostLikeStatusCommand): Promise<void> {
    const {
      userId,
      id,
      data: { likeStatus },
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

    const likesArr = post.extendedLikesInfo.likes.map((l) => l.userId);
    const dislikesArr = post.extendedLikesInfo.dislikes.map((d) => d.userId);
    const likeOrDislikeInfo = {
      userId: userId,
      login: user.login,
      addedAt: new Date(),
    } as BaseLikesDislikesDBData;

    if (likeStatus === UserLikeStatus.LIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        post.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
      if (!likesArr.includes(userId) && dislikesArr.includes(userId)) {
        post.deleteLikeOrDislike('dislikes', userId);
        post.addLikeOrDislike('likes', likeOrDislikeInfo);
      }
    }

    if (likeStatus === UserLikeStatus.DISLIKE) {
      if (!likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        post.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
      if (likesArr.includes(userId) && !dislikesArr.includes(userId)) {
        post.deleteLikeOrDislike('likes', userId);
        post.addLikeOrDislike('dislikes', likeOrDislikeInfo);
      }
    }

    if (likeStatus === UserLikeStatus.NONE) {
      if (likesArr.includes(userId)) {
        post.deleteLikeOrDislike('likes', userId);
      }

      if (dislikesArr.includes(userId)) {
        post.deleteLikeOrDislike('dislikes', userId);
      }
    }

    await this.postRepository.save(post);
  }
}
