import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  BlogInputDto,
  BlogViewDto,
  PostForBlogInputDto,
  PostViewDto,
} from '../../../src/features/bloggers-platform';
import request from 'supertest';
import { BLOGS_API_PATH, POSTS_API_PATH } from '../../../src/constants';
import { delay } from '../functions';

export class BlogTestManager {
  constructor(private app: INestApplication) {}

  public createBlogInputDto(index: number): BlogInputDto {
    return {
      name: `blog_${index}`,
      description: `description_${index}`,
      websiteUrl: `https://example${index}.com`,
    };
  }

  public createPostForBlogInputDto(index: number): PostForBlogInputDto {
    return {
      title: `title_${index}`,
      content: `content_${index}`,
      shortDescription: `shortDescription_${index}`,
    };
  }

  async createBlog(index: number): Promise<BlogViewDto> {
    const blogInputDto = this.createBlogInputDto(index);

    const response = await request(this.app.getHttpServer())
      .post(`/${BLOGS_API_PATH}`)
      .send(blogInputDto)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.CREATED);

    return response.body;
  }

  async createSeveralBlogs(index: number): Promise<BlogViewDto[]> {
    const blogs = [] as BlogViewDto[];
    for (let i = 1; i <= index; i++) {
      await delay(50);
      const blog = await this.createBlog(i);
      blogs.unshift(blog);
    }

    return blogs;
  }

  async createPostForBlog(index: number, blogId: string): Promise<PostViewDto> {
    const postForBlogInputDto = this.createPostForBlogInputDto(index);

    const response = await request(this.app.getHttpServer())
      .post(`/${BLOGS_API_PATH}/${blogId}/${POSTS_API_PATH.ROOT_URL}`)
      .send(postForBlogInputDto)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.CREATED);

    return response.body;
  }

  async createSeveralPostsForBlog(
    index: number,
    blogId: string,
  ): Promise<PostViewDto[]> {
    const posts = [] as PostViewDto[];

    for (let i = 1; i <= index; i++) {
      await delay(50);
      const post = await this.createPostForBlog(i, blogId);
      posts.unshift(post);
    }

    return posts;
  }
}
