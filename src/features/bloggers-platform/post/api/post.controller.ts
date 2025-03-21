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
import { PostQueryRepository } from '../infrastructure';
import { PostInputDto, PostsQueryParams, PostViewDto } from '../dto';
import {
  BasicAuthGuard,
  BearerAuthGuard,
  PaginatedViewDto,
} from '../../../../core';
import {
  CommentInputDto,
  CommentQueryRepository,
  CommentsQueryParams,
  CommentViewDto,
} from '../../comment';
import { Types } from 'mongoose';
import { COMMENTS_API_PATH, POSTS_API_PATH } from '../../../../constants';
import { BaseLikeStatusInputDto } from '../../../../core/dto';
import { CommandBus } from '@nestjs/cqrs';
import { GetPostByIdCommand } from '../application/use-cases/get-post-by-id.use-case';
import { CreatePostCommand } from '../application/use-cases/create-post.use-case';
import { CreateCommentForPostCommand } from '../application/use-cases/create-comment-for-post.use-case';
import { UpdatePostCommand } from '../application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../application/use-cases/delete-post.use-case';
import { ChangePostLikeStatusCommand } from '../application/use-cases/change-post-like-status.use-case';

@Controller(POSTS_API_PATH.ROOT_URL)
export class PostController {
  constructor(
    private commandBus: CommandBus,
    private postQueryRepository: PostQueryRepository,
    private commentsQueryRepository: CommentQueryRepository,
  ) {}

  @Get()
  async getAllPosts(
    @Req() req: Request & { userId: string },
    @Query() query: PostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const queryParams = new PostsQueryParams(query);

    return this.postQueryRepository.getAllPosts(queryParams, req.userId);
  }

  @Get(':id')
  async getPostById(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
  ): Promise<PostViewDto> {
    return this.postQueryRepository.getPostById(id, req.userId);
  }

  @Get(`:id/${COMMENTS_API_PATH.ROOT_URL}`)
  async getCommentsForPost(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Query() query: CommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const queryParams = new CommentsQueryParams(query);
    const postId = await this.commandBus.execute(new GetPostByIdCommand(id));

    return this.commentsQueryRepository.getCommentsForPost(
      postId!,
      queryParams,
      req.userId,
    );
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() data: PostInputDto): Promise<PostViewDto> {
    const postId = await this.commandBus.execute(new CreatePostCommand(data));

    return this.postQueryRepository.getPostById(postId!);
  }

  @UseGuards(BearerAuthGuard)
  @Post(`:id/${COMMENTS_API_PATH.ROOT_URL}`)
  async createCommentForPost(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() date: CommentInputDto,
  ): Promise<CommentViewDto> {
    const commentId = await this.commandBus.execute(
      new CreateCommentForPostCommand(id, req.userId, date),
    );

    return this.commentsQueryRepository.getCommentById(commentId);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: Types.ObjectId,
    @Body() data: PostInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(new UpdatePostCommand(id, data));
  }

  @UseGuards(BearerAuthGuard)
  @Put(`:id/${POSTS_API_PATH.LIKE_STATUS}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeLikeStatus(
    @Req() req: Request & { userId: string },
    @Param('id') id: Types.ObjectId,
    @Body() data: BaseLikeStatusInputDto,
  ): Promise<void> {
    return await this.commandBus.execute(
      new ChangePostLikeStatusCommand(req.userId, id, data),
    );
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: Types.ObjectId): Promise<void> {
    return await this.commandBus.execute(new DeletePostCommand(id));
  }
}
