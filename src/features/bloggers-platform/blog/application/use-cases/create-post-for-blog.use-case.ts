import { ObjectId } from 'mongodb';
import { PostForBlogInputDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType, PostRepository } from '../../../post';
import { BlogRepository } from '../../infrastructure';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';

export class CreatePostForBlogCommand {
  constructor(
    public id: ObjectId,
    public dto: PostForBlogInputDto,
  ) {}
}

//TODO refactoring forwardRef
@CommandHandler(CreatePostForBlogCommand)
export class CreatePostForBlogUseCase
  implements ICommandHandler<CreatePostForBlogCommand>
{
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogRepository: BlogRepository,
    @Inject(forwardRef(() => PostRepository))
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreatePostForBlogCommand): Promise<ObjectId | void> {
    const {
      id,
      dto: { title, content, shortDescription },
    } = command;

    const blog = await this.blogRepository.findBlogById(id);

    if (!blog) {
      throw new NotFoundException({
        errorsMessages: [
          {
            field: 'id',
            message: `Blog with id ${id} not found`,
          },
        ],
      });
    }

    const post = this.PostModel.createInstance({
      title,
      content,
      shortDescription,
      blogId: id.toString(),
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post._id;
  }
}
