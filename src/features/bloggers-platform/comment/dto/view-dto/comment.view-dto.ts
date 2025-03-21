import { CommentDocument } from '../../domain';
import { CommentCommentatorInfoViewDto } from './comment-commentator-info.view-dto';
import { CommentsLikesDislikesInfoViewDto } from './comments-likes-dislikes-info.view-dto';

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentCommentatorInfoViewDto;
  createdAt: Date;
  likesInfo: CommentsLikesDislikesInfoViewDto;

  static mapToView(comment: CommentDocument, userId?: string): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.createdAt = comment.createdAt;

    dto.commentatorInfo = new CommentCommentatorInfoViewDto(
      comment.commentatorInfo,
    );

    dto.likesInfo = new CommentsLikesDislikesInfoViewDto(
      comment.likesInfo.likes,
      comment.likesInfo.dislikes,
      userId,
    );

    return dto;
  }
}
