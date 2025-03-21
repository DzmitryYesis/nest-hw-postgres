import { CommentatorInfo } from '../../domain';

export class CommentCommentatorInfoViewDto {
  userId: string;
  userLogin: string;

  constructor(commentatorInfo: CommentatorInfo) {
    this.userId = commentatorInfo.userId;
    this.userLogin = commentatorInfo.userLogin;
  }
}
