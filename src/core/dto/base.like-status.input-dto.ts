import { UserLikeStatus } from '../../constants';
import { IsEnum } from 'class-validator';

export class BaseLikeStatusInputDto {
  @IsEnum(UserLikeStatus)
  likeStatus: UserLikeStatus;
}
