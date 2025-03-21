import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure';
import { NotFoundException } from '@nestjs/common';

export class DeletePostCommand {
  constructor(public id: ObjectId) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(private postRepository: PostRepository) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const post = await this.postRepository.findPostById(command.id);

    if (!post) {
      throw new NotFoundException(`Post with id ${command.id} not found`);
    }

    post.deletePost();

    await this.postRepository.save(post);
  }
}
