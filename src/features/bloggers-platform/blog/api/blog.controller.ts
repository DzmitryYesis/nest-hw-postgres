import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogQueryRepository } from '../infrastructure';
import { BasicAuthGuard, PaginatedViewDto } from '../../../../core';
import {
  BlogInputDto,
  BlogsQueryParams,
  BlogViewDto,
  PostForBlogInputDto,
} from '../dto';
import { ObjectId } from 'mongodb';
import { PostQueryRepository, PostsQueryParams, PostViewDto } from '../../post';
import { BLOGS_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { Types } from 'mongoose';
import { Public } from '../../../../core/decorators';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CreatePostForBlogCommand } from '../application/use-cases/create-post-for-blog.use-case';
import { GetBlogByIdCommand } from '../application/use-cases/get-blog-by-id.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';

@UseGuards(BasicAuthGuard)
@Controller(BLOGS_API_PATH)
export class BlogController {
  constructor(
    private blogQueryRepository: BlogQueryRepository,
    private postQueryRepository: PostQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Public()
  @Get()
  async getAllBlogs(
    @Query() query: BlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const queryParams = new BlogsQueryParams(query);

    return this.blogQueryRepository.getAllBlogs(queryParams);
  }

  @Public()
  @Get(':id')
  async getBlogById(@Param('id') id: Types.ObjectId): Promise<BlogViewDto> {
    return this.blogQueryRepository.getBlogById(new ObjectId(id));
  }

  @Public()
  @Get(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async getPostsForBlog(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);
    const blogId = await this.commandBus.execute(new GetBlogByIdCommand(id));

    return this.postQueryRepository.getPostsForBlog(
      blogId!,
      queryParams,
      req.userId,
    );
  }

  @Post()
  async createBlog(@Body() data: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute(new CreateBlogCommand(data));

    return this.blogQueryRepository.getBlogById(blogId);
  }

  @Post(`:id/${POSTS_API_PATH.ROOT_URL}`)
  async createPostForBlog(
    @Param('id') id: Types.ObjectId,
    @Body() data: PostForBlogInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.commandBus.execute(
      new CreatePostForBlogCommand(id, data),
    );

    return this.postQueryRepository.getPostById(postId!);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: Types.ObjectId,
    @Body() data: BlogInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(new UpdateBlogCommand(id, data));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: Types.ObjectId): Promise<void> {
    return await this.commandBus.execute(new DeleteBlogCommand(id));
  }
}
