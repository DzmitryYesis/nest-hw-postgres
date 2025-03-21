import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';

export class GetPostByIdCommand {
  constructor(public id: ObjectId) {}
}

@CommandHandler(GetPostByIdCommand)
export class GetPostByIdUseCase implements ICommandHandler<GetPostByIdCommand> {
  constructor(private postRepository: PostRepository) {}

  async execute(command: GetPostByIdCommand): Promise<string | null> {
    const post = await this.postRepository.findPostById(command.id);

    if (!post) {
      throw new NotFoundException(`Post with id ${command.id} not found`);
    }

    return post._id.toString();
  }
}
