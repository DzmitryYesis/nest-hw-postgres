import { BlogInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain';
import { BlogRepository } from '../../infrastructure';
import { ObjectId } from 'mongodb';

export class CreateBlogCommand {
  constructor(public dto: BlogInputDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogRepository: BlogRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<ObjectId> {
    const { name, description, websiteUrl } = command.dto;

    const blog = this.BlogModel.createInstance({
      name,
      description,
      websiteUrl,
    });

    await this.blogRepository.save(blog);

    return blog._id;
  }
}
