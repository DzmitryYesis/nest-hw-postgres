import { UserLikeStatus } from '../../../../../constants';
import { NewestLikeViewDto } from './newest-likes.view-dto';
import { BaseLikesDislikesDBData } from '../../../../../core';

export class PostsLikesDislikesInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: UserLikeStatus;
  newestLikes: NewestLikeViewDto[];

  constructor(
    likes: BaseLikesDislikesDBData[],
    dislikes: BaseLikesDislikesDBData[],
    userId?: string,
  ) {
    this.likesCount = likes.length;
    this.dislikesCount = dislikes.length;
    this.myStatus = PostsLikesDislikesInfoViewDto.getUserLikeStatus(
      likes,
      dislikes,
      userId,
    );
    this.newestLikes = likes
      .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
      .slice(0, 3)
      .map((like) => new NewestLikeViewDto(like));
  }

  private static getUserLikeStatus(
    likes: BaseLikesDislikesDBData[],
    dislikes: BaseLikesDislikesDBData[],
    userId?: string,
  ): UserLikeStatus {
    if (userId && likes.some((item) => item.userId === userId)) {
      return UserLikeStatus.LIKE;
    }
    if (userId && dislikes.some((item) => item.userId === userId)) {
      return UserLikeStatus.DISLIKE;
    }
    return UserLikeStatus.NONE;
  }
}
