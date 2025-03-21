import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure';

export class DeleteBlogCommand {
  constructor(public id: ObjectId) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: DeleteBlogCommand): Promise<void> {
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

    blog.deleteBlog();

    await this.blogRepository.save(blog);
  }
}
