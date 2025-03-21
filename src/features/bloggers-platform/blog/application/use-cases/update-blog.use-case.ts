import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../infrastructure';
import { BlogInputDto } from '../../dto';

export class UpdateBlogCommand {
  constructor(
    public id: ObjectId,
    public dto: BlogInputDto,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private blogRepository: BlogRepository) {}

  async execute(command: UpdateBlogCommand): Promise<void> {
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

    blog.updateBlog(command.dto);

    await this.blogRepository.save(blog);
  }
}
