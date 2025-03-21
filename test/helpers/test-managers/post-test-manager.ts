import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  BlogViewDto,
  PostInputDto,
  PostViewDto,
} from '../../../src/features/bloggers-platform';
import { BlogTestManager } from './blog-test-manager';
import request from 'supertest';
import { COMMENTS_API_PATH, POSTS_API_PATH } from '../../../src/constants';
import { delay } from 'rxjs';
import {
  CommentInputDto,
  CommentViewDto,
} from '../../../src/features/bloggers-platform/comment';
import { UserTestManager } from './user-test-manager';
import { getStringWithLength } from '../functions';

export class PostTestManager {
  constructor(
    private app: INestApplication,
    private blogTestManager: BlogTestManager,
    private userTestManager: UserTestManager,
  ) {}

  public createPostInputDto(index: number, blogId: string): PostInputDto {
    return {
      title: `post_${index}`,
      content: `content_${index}`,
      shortDescription: `shortDescription_${index}`,
      blogId,
    };
  }

  public createCommentForPostInputDto(index: number): CommentInputDto {
    return {
      content: `comment_${index}` + getStringWithLength(20),
    };
  }

  async createPost(
    index: number,
    blogIndex: number = 1,
  ): Promise<{ post: PostViewDto; blog: BlogViewDto }> {
    const blog = await this.blogTestManager.createBlog(blogIndex);
    const postInputDto = this.createPostInputDto(index, blog.id);

    const response = await request(this.app.getHttpServer())
      .post(`/${POSTS_API_PATH.ROOT_URL}`)
      .send(postInputDto)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.CREATED);

    return { post: response.body, blog };
  }

  async createSeveralPosts(
    index: number,
    blogIndex: number = 1,
  ): Promise<PostViewDto[]> {
    const posts = [] as PostViewDto[];

    for (let i = 1; i <= index; i++) {
      await delay(50);
      const { post } = await this.createPost(i, blogIndex);
      posts.unshift(post);
    }

    return posts;
  }

  async createSeveralCommentsForPost(
    index: number,
    postIndex: number,
  ): Promise<{
    post: PostViewDto;
    comments: CommentViewDto[];
    accessToken: string;
  }> {
    const { accessToken } = await this.userTestManager.loggedInUser(1);
    const { post } = await this.createPost(postIndex, 1);
    const comments = [] as CommentViewDto[];

    for (let i = 1; i <= index; i++) {
      await delay(50);
      const commentInputDto = this.createCommentForPostInputDto(1);
      const response = await request(this.app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send(commentInputDto);

      comments.unshift(response.body);
    }

    return { post, comments, accessToken };
  }
}
