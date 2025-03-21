import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure';

export class DeleteUserByIdCommand {
  constructor(public id: ObjectId) {}
}

@CommandHandler(DeleteUserByIdCommand)
export class DeleteUserByIdUseCase
  implements ICommandHandler<DeleteUserByIdCommand>
{
  constructor(private usersRepository: UsersRepository) {}

  async execute(command: DeleteUserByIdCommand): Promise<void> {
    const user = await this.usersRepository.findByCredentials(
      '_id',
      command.id,
    );

    if (!user) {
      throw new NotFoundException(`User with id ${command.id} not found`);
    }

    user.deleteUser();

    await this.usersRepository.save(user);
  }
}
