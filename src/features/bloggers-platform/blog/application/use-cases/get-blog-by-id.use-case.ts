import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure';

export class GetBlogByIdCommand {
  constructor(public id: ObjectId) {}
}

@CommandHandler(GetBlogByIdCommand)
export class GetBlogByIdUseCase implements ICommandHandler<GetBlogByIdCommand> {
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: GetBlogByIdCommand): Promise<string | null> {
    const blog = await this.blogRepository.findBlogById(command.id);

    if (!blog) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Blog with id ${command.id} not found`,
          },
        ],
      });
    }

    return blog._id.toString();
  }
}
