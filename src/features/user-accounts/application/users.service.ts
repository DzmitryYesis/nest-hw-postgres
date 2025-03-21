import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure';

//TODO create class for 400 error
//TODO refactoring the same logic for checkin refresh token expire time
@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async checkIsUserUnique(field: string, value: string): Promise<boolean> {
    const user = await this.usersRepository.findByCredentials(field, value);

    if (user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            field: field,
            message: 'not unique',
          },
        ],
      });
    }

    return false;
  }
}
