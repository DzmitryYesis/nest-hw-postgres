import { UserLikeStatus } from '../../../../../constants';
import { BaseLikesDislikesDBData } from '../../../../../core';

export class CommentsLikesDislikesInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: UserLikeStatus;

  constructor(
    likes: BaseLikesDislikesDBData[],
    dislikes: BaseLikesDislikesDBData[],
    userId?: string,
  ) {
    this.likesCount = likes.length;
    this.dislikesCount = dislikes.length;
    this.myStatus = CommentsLikesDislikesInfoViewDto.getUserLikeStatus(
      likes,
      dislikes,
      userId,
    );
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
