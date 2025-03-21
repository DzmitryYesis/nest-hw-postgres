import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  authBasic,
  BlogTestManager,
  deleteAllData,
  ErrorMessage,
  getStringWithLength,
  invalidId,
  UserTestManager,
} from './helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import { PostTestManager } from './helpers/test-managers';
import request from 'supertest';
import {
  COMMENTS_API_PATH,
  POSTS_API_PATH,
  UserLikeStatus,
} from '../src/constants';
import { PostViewDto } from '../src/features/bloggers-platform';
import {
  CommentInputDto,
  CommentViewDto,
} from '../src/features/bloggers-platform/comment';
import { BaseLikeStatusInputDto } from '../src/core/dto';

describe('Posts controller (e2e)', () => {
  let app: INestApplication;
  let postTestManager: PostTestManager;
  let blogTestManager: BlogTestManager;
  let userTestManager: UserTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    appSetup(app);

    await app.init();

    blogTestManager = new BlogTestManager(app);
    userTestManager = new UserTestManager(app);

    postTestManager = new PostTestManager(
      app,
      blogTestManager,
      userTestManager,
    );

    await deleteAllData(app);
  });

  afterEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  //GET /posts
  describe('Get posts', () => {
    it('should return response with default queries data and empty Array for items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should response with default queries data and 1 post', async () => {
      const { post } = await postTestManager.createPost(1);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [post],
      });
    });

    it('should response with default queries data and 3 posts', async () => {
      const posts = await postTestManager.createSeveralPosts(3);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: posts,
      });
    });

    it('should response with default queries data and 10 posts', async () => {
      const posts = await postTestManager.createSeveralPosts(15);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 15,
        items: posts.slice(0, 10),
      });
      expect(response.body.items.length).toBe(10);
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy ', async () => {
      await postTestManager.createSeveralPosts(5);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}?sortBy=ert`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortBy',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortDirection, pageSize and pageNumber ', async () => {
      await postTestManager.createSeveralPosts(5);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}?sortBy=title&sortDirection=wer&pageSize=-2&pageNumber=dfg`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(3);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortDirection',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageSize',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageNumber',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with queries pageSize=30 data and 20 posts', async () => {
      const posts = await postTestManager.createSeveralPosts(20);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}?pageSize=30`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 30,
        totalCount: 20,
        items: posts,
      });
      expect(response.body.items.length).toBe(20);
    });

    it('should response with queries pageSize=30 sortDirection=asc data and 20 posts', async () => {
      const posts = await postTestManager.createSeveralPosts(20);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}?pageSize=30&sortDirection=asc`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 30,
        totalCount: 20,
        items: posts.reverse(),
      });
      expect(response.body.items.length).toBe(20);
    });

    it('should response with queries pageSize=8 pageNumber=7 sortDirection=asc', async () => {
      const posts = await postTestManager.createSeveralPosts(80);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}?pageSize=8&pageNumber=7&sortDirection=asc`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 10,
        page: 7,
        pageSize: 8,
        totalCount: 80,
        items: posts.reverse().slice(48, 56),
      });
      expect(response.body.items.length).toBe(8);
    });

    it('should response with queries pageSize=20 sortBy=blogName', async () => {
      const postsForBlog1 = await postTestManager.createSeveralPosts(5, 1);
      const postsForBlog2 = await postTestManager.createSeveralPosts(5, 2);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}?pageSize=20&sortBy=blogName`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 20,
        totalCount: 10,
        items: [...postsForBlog2.reverse(), ...postsForBlog1.reverse()],
      });
      expect(response.body.items.length).toBe(10);
    });

    it('should response with queries pageSize=20 sortBy=blogName sortDirection=asc', async () => {
      const postsForBlog1 = await postTestManager.createSeveralPosts(5, 1);
      const postsForBlog2 = await postTestManager.createSeveralPosts(5, 2);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}?pageSize=20&sortBy=blogName&sortDirection=asc`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 20,
        totalCount: 10,
        items: [...postsForBlog1.reverse(), ...postsForBlog2.reverse()],
      });
      expect(response.body.items.length).toBe(10);
    });
  });

  //GET /posts/:id
  describe('Get post by id', () => {
    it("shouldn't get post by invalid postId", async () => {
      await postTestManager.createPost(1);

      await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${invalidId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't get blog by incorrect postId", async () => {
      await postTestManager.createPost(1);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${2345}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return post by postId', async () => {
      const { post, blog } = await postTestManager.createPost(1);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual(post);
      expect(response.body.blogId).toBe(blog.id);
    });
  });

  //GET /posts/:id/comments
  describe('Get comments for post', () => {
    it('should response with error NOT_FOUND_404 for invalid postId', async () => {
      await postTestManager.createPost(1);

      await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${invalidId}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should response with error BAD_REQUEST for incorrect postId', async () => {
      await postTestManager.createPost(1);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${345}/${COMMENTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with default queries data and empty items array', async () => {
      const { post } = await postTestManager.createPost(1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
      expect(response.body.items.length).toBe(0);
    });

    it('should response with default queries data and 1 comment', async () => {
      const { comments, post } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: comments,
      });
      expect(response.body.items.length).toBe(1);
    });

    it('should response with default queries data and 5 comment', async () => {
      const { comments, post } =
        await postTestManager.createSeveralCommentsForPost(5, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 5,
        items: comments,
      });
      expect(response.body.items.length).toBe(5);
    });

    it('should response with default queries data and 10 comment', async () => {
      const { comments, post } =
        await postTestManager.createSeveralCommentsForPost(25, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 3,
        page: 1,
        pageSize: 10,
        totalCount: 25,
        items: comments.slice(0, 10),
      });
      expect(response.body.items.length).toBe(10);
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy ', async () => {
      const { post } = await postTestManager.createSeveralCommentsForPost(5, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}?sortBy=ert`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortBy',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortDirection, pageSize and pageNumber ', async () => {
      const { post } = await postTestManager.createSeveralCommentsForPost(5, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}?sortBy=content&sortDirection=wer&pageSize=-2&pageNumber=dfg`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(3);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortDirection',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageSize',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageNumber',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with queries pageSize=7 pageNumber=3', async () => {
      const { comments, post } =
        await postTestManager.createSeveralCommentsForPost(40, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}?pageSize=7&pageNumber=3`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 6,
        page: 3,
        pageSize: 7,
        totalCount: 40,
        items: comments.slice(14, 21),
      });
      expect(response.body.items.length).toBe(7);
    });

    it('should response with queries pageSize=6 pageNumber=4 sortDirection=asc', async () => {
      const { comments, post } =
        await postTestManager.createSeveralCommentsForPost(40, 1);

      const response = await request(app.getHttpServer())
        .get(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}?pageSize=6&pageNumber=4&sortDirection=asc`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 7,
        page: 4,
        pageSize: 6,
        totalCount: 40,
        items: comments.reverse().slice(18, 24),
      });
      expect(response.body.items.length).toBe(6);
    });
  });

  //POST /posts
  describe('Create post', () => {
    it('should return error NOT_AUTH_401', async () => {
      const blog = await blogTestManager.createBlog(1);
      const postInputDto = postTestManager.createPostInputDto(1, blog.id);

      await request(app.getHttpServer())
        .post(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic bla-bla`)
        .send(postInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with status BAD_REQUEST for invalid blogId', async () => {
      const postInputDto = postTestManager.createPostInputDto(1, invalidId);

      const response = await request(app.getHttpServer())
        .post(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'blogId',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields title, content, shortDescription, blogId', async () => {
      const postInputDto = postTestManager.createPostInputDto(1, '345');

      const response = await request(app.getHttpServer())
        .post(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          title: getStringWithLength(31),
          shortDescription: getStringWithLength(101),
          content: getStringWithLength(1001),
          blogId: postInputDto.blogId,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(4);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'shortDescription',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'content',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'blogId',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields title, blogId', async () => {
      const postInputDto = postTestManager.createPostInputDto(1, '345');

      const response = await request(app.getHttpServer())
        .post(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          title: getStringWithLength(31),
          shortDescription: postInputDto.shortDescription,
          content: postInputDto.content,
          blogId: postInputDto.blogId,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'blogId',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields title', async () => {
      const blog = await blogTestManager.createBlog(1);
      const postInputDto = postTestManager.createPostInputDto(1, blog.id);

      const response = await request(app.getHttpServer())
        .post(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          title: getStringWithLength(31),
          shortDescription: postInputDto.shortDescription,
          content: postInputDto.content,
          blogId: postInputDto.blogId,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should created and return post', async () => {
      const blog = await blogTestManager.createBlog(1);
      const postInputDto = postTestManager.createPostInputDto(1, blog.id);

      const response = await request(app.getHttpServer())
        .post(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDto)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        title: postInputDto.title,
        content: postInputDto.content,
        shortDescription: postInputDto.shortDescription,
        blogId: blog.id,
        blogName: blog.name,
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [],
        },
      } as PostViewDto);
    });
  });

  //POST /posts/:id/comments
  describe('Create comment for posts', () => {
    it('should return response with error NOT_AUTH_401', async () => {
      const { post } = await postTestManager.createPost(1);
      const commentInputDto = postTestManager.createCommentForPostInputDto(1);

      await request(app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer bla-bla-bla`)
        .send(commentInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with error BAD_REQUEST_400 for small content length', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: getStringWithLength(15) } as CommentInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error BAD_REQUEST_400 for big content length', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: getStringWithLength(350) } as CommentInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error NOT_FOUND_404 for invalid postId', async () => {
      await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);
      const comment = postTestManager.createCommentForPostInputDto(1);

      const response = await request(app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${invalidId}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send(comment)
        .expect(HttpStatus.NOT_FOUND);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error NOT_FOUND_404 for incorrect postId', async () => {
      await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);
      const comment = postTestManager.createCommentForPostInputDto(1);

      await request(app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${345}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send(comment)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should created and return comment', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken, user } = await userTestManager.loggedInUser(1);
      const comment = postTestManager.createCommentForPostInputDto(1);

      const response = await request(app.getHttpServer())
        .post(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${COMMENTS_API_PATH.ROOT_URL}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send(comment)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        content: comment.content,
        commentatorInfo: {
          userId: user.id,
          userLogin: user.login,
        },
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
        },
      } as CommentViewDto);
    });
  });

  //PUT /posts/:id
  describe('Update post', () => {
    it("shouldn't update post without auth", async () => {
      const { post, blog } = await postTestManager.createPost(1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        blog.id,
      );

      await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic bla-bla`)
        .send(postInputDtoForUpdate)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't update post with invalid postId", async () => {
      const { blog } = await postTestManager.createPost(1, 1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        blog.id,
      );

      await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDtoForUpdate)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't update post with incorrect postId", async () => {
      const { blog } = await postTestManager.createPost(1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        blog.id,
      );

      const response = await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${345}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDtoForUpdate)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields title, content', async () => {
      const { blog, post } = await postTestManager.createPost(1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        blog.id,
      );

      const response = await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...postInputDtoForUpdate, title: '', content: '' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'title',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'content',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST for invalid blogId', async () => {
      const { post } = await postTestManager.createPost(1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        invalidId,
      );

      const response = await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDtoForUpdate)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'blogId',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields blogId', async () => {
      const { post } = await postTestManager.createPost(1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        '345',
      );

      const response = await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDtoForUpdate)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'blogId',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should update post', async () => {
      const { blog, post } = await postTestManager.createPost(1);
      const postInputDtoForUpdate = postTestManager.createPostInputDto(
        2,
        blog.id,
      );

      await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDtoForUpdate)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        ...postInputDtoForUpdate,
      });
    });
  });

  //PUT /posts/:id/like-status
  describe('Change like info for post', () => {
    it('should return response with error NOT_AUTH for like post request', async () => {
      const { post } = await postTestManager.createPost(1);
      await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${'bla-bla-token'}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with error NOT_FOUND for like post request with invalid id', async () => {
      await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${invalidId}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return response with error BAD_REQUEST for like post request with incorrect id', async () => {
      await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .put(`/${POSTS_API_PATH.ROOT_URL}/${345}/${POSTS_API_PATH.LIKE_STATUS}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error BAD_REQUEST when send likeStatus: `` for like post request', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: '' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'likeStatus',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error BAD_REQUEST when send likeStatus: wrong format for like post request', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'blabla' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'likeStatus',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should add like for post', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken, user } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.LIKE,
          newestLikes: [
            {
              userId: user.id,
              login: user.login,
              addedAt: expect.any(String),
            },
          ],
        },
      } as PostViewDto);
    });

    it('should add like for post and show myStatus: None for non auth user', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken, user } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [
            {
              userId: user.id,
              login: user.login,
              addedAt: expect.any(String),
            },
          ],
        },
      } as PostViewDto);
    });

    it('should add like, then dislike for post and show myStatus: Dislike for auth user', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 1,
          myStatus: UserLikeStatus.DISLIKE,
          newestLikes: [],
        },
      } as PostViewDto);
    });

    it('should add like, then dislike for post and show myStatus: None for non auth user', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 1,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [],
        },
      } as PostViewDto);
    });

    it('should add dislike, then like for post and show myStatus: None for non auth user', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken, user } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [
            {
              userId: user.id,
              login: user.login,
              addedAt: expect.any(String),
            },
          ],
        },
      } as PostViewDto);
    });

    it('should add like, then like for post and show myStatus: None for non auth user', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken, user } = await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [
            {
              userId: user.id,
              login: user.login,
              addedAt: expect.any(String),
            },
          ],
        },
      } as PostViewDto);
    });

    it('should add like from user1, then dislike from user2 for post and show myStatus: None for non auth user1', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken: accessTokenUser1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessTokenUser2 } =
        await userTestManager.loggedInUser(2);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 1,
          dislikesCount: 1,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [
            {
              userId: user1.id,
              login: user1.login,
              addedAt: expect.any(String),
            },
          ],
        },
      } as PostViewDto);
    });

    it('should add like from user1, then like from user2 for post and show myStatus: Like for auth user2', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken: accessTokenUser1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessTokenUser2, user: user2 } =
        await userTestManager.loggedInUser(2);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 2,
          dislikesCount: 0,
          myStatus: UserLikeStatus.LIKE,
          newestLikes: [
            {
              userId: user2.id,
              login: user2.login,
              addedAt: expect.any(String),
            },
            {
              userId: user1.id,
              login: user1.login,
              addedAt: expect.any(String),
            },
          ],
        },
      } as PostViewDto);
    });

    it('should add dislike from user1, then dislike from user2 for post and show myStatus: Dislike for auth user2', async () => {
      const { post } = await postTestManager.createPost(1);
      const { accessToken: accessTokenUser1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessTokenUser2 } =
        await userTestManager.loggedInUser(2);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...post,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 2,
          myStatus: UserLikeStatus.DISLIKE,
          newestLikes: [],
        },
      } as PostViewDto);
    });

    it('should add like from user1, user2 for post1, dislike from user2, user3 for post2, dislike from user1 and like from user3 for post3 show myStatus for auth user1: like for post1, none for post2 and dislike for post3', async () => {
      const posts = await postTestManager.createSeveralPosts(3);

      const post1 = posts[0];
      const post2 = posts[1];
      const post3 = posts[2];

      const { accessToken: accessTokenUser1, user: user1 } =
        await userTestManager.loggedInUser(1);
      const { accessToken: accessTokenUser2, user: user2 } =
        await userTestManager.loggedInUser(2);
      const { accessToken: accessTokenUser3, user: user3 } =
        await userTestManager.loggedInUser(3);

      //like from user1, user2 for post1
      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post1.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post1.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      //dislike from user2, user3 for post2
      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post2.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post2.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser3}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      //dislike from user1, like from user3 for post3
      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post3.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${POSTS_API_PATH.ROOT_URL}/${post3.id}/${POSTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser3}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: [
          {
            ...post1,
            extendedLikesInfo: {
              likesCount: 2,
              dislikesCount: 0,
              myStatus: UserLikeStatus.LIKE,
              newestLikes: [
                {
                  userId: user2.id,
                  login: user2.login,
                  addedAt: expect.any(String),
                },
                {
                  userId: user1.id,
                  login: user1.login,
                  addedAt: expect.any(String),
                },
              ],
            },
          } as PostViewDto,
          {
            ...post2,
            extendedLikesInfo: {
              likesCount: 0,
              dislikesCount: 2,
              myStatus: UserLikeStatus.NONE,
              newestLikes: [],
            },
          } as PostViewDto,
          {
            ...post3,
            extendedLikesInfo: {
              likesCount: 1,
              dislikesCount: 1,
              myStatus: UserLikeStatus.DISLIKE,
              newestLikes: [
                {
                  userId: user3.id,
                  login: user3.login,
                  addedAt: expect.any(String),
                },
              ],
            },
          } as PostViewDto,
        ],
      });
    });
  });

  //DELETE /posts/:id
  describe('Delete posts by id', () => {
    it("shouldn't delete post without auth", async () => {
      const { post } = await postTestManager.createPost(1, 1);

      await request(app.getHttpServer())
        .delete(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't delete post by invalid postId", async () => {
      await postTestManager.createPost(1, 1);

      await request(app.getHttpServer())
        .delete(`/${POSTS_API_PATH.ROOT_URL}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't delete post by incorrect postId", async () => {
      await postTestManager.createPost(1, 1);

      const response = await request(app.getHttpServer())
        .delete(`/${POSTS_API_PATH.ROOT_URL}/${2345}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('delete post by postId', async () => {
      const { post } = await postTestManager.createPost(1, 1);

      await request(app.getHttpServer())
        .delete(`/${POSTS_API_PATH.ROOT_URL}/${post.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
