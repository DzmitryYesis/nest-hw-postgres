import { PostInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { BlogRepository } from '../../../blog';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain';
import { ObjectId } from 'mongodb';

export class CreatePostCommand {
  constructor(public dto: PostInputDto) {}
}

//TODO refactoring forwardRef
@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postRepository: PostRepository,
    @Inject(forwardRef(() => BlogRepository))
    private blogRepository: BlogRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<ObjectId | void> {
    const { title, content, shortDescription, blogId } = command.dto;

    const blog = await this.blogRepository.findBlogById(new ObjectId(blogId));

    if (!blog) {
      throw new NotFoundException(`Blog with id ${blogId} not found`);
    }

    const post = this.PostModel.createInstance({
      title,
      content,
      shortDescription,
      blogId,
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post._id;
  }
}
