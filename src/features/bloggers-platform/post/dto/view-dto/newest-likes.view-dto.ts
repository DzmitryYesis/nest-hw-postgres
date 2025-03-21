import { BaseLikesDislikesDBData } from '../../../../../core';

export class NewestLikeViewDto {
  addedAt: string;
  userId: string;
  login: string;

  constructor(like: BaseLikesDislikesDBData) {
    this.addedAt = like.addedAt.toISOString();
    this.userId = like.userId;
    this.login = like.login;
  }
}
