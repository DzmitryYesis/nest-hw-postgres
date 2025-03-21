import { ObjectId } from 'mongodb';
import { PostInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../../blog';

export class UpdatePostCommand {
  constructor(
    public id: ObjectId,
    public dto: PostInputDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private postRepository: PostRepository,
    @Inject(forwardRef(() => BlogRepository))
    private blogRepository: BlogRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const {
      id,
      dto: { title, content, shortDescription, blogId },
    } = command;

    const post = await this.postRepository.findPostById(id);
    const blog = await this.blogRepository.findBlogById(new ObjectId(blogId));

    if (!blog) {
      throw new NotFoundException(`Blog with id ${blogId} not found`);
    }
    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    post.updatePost({
      title,
      content,
      shortDescription,
      blogId,
      blogName: blog.name,
    });

    await this.postRepository.save(post);
  }
}
