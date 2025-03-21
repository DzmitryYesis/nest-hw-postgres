import { UserDocument } from '../../domain';

export class UserInfoViewDto {
  userId: string;
  login: string;
  email: string;

  static mapToView(user: UserDocument): UserInfoViewDto {
    const dto = new UserInfoViewDto();

    dto.login = user.login;
    dto.email = user.email;
    dto.userId = user._id.toString();

    return dto;
  }
}
