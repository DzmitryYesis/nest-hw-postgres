import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  authBasic,
  BlogTestManager,
  deleteAllData,
  ErrorMessage,
  getStringWithLength,
  invalidId,
} from './helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import request from 'supertest';
import {
  BLOGS_API_PATH,
  POSTS_API_PATH,
  UserLikeStatus,
} from '../src/constants';
import { BlogViewDto, PostViewDto } from '../src/features/bloggers-platform';

describe('Blogs controller (e2e)', () => {
  let app: INestApplication;
  let blogTestManager: BlogTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    appSetup(app);

    await app.init();

    blogTestManager = new BlogTestManager(app);

    await deleteAllData(app);
  });

  afterEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  //GET /blogs
  describe('Get blogs', () => {
    it('should return response with default queries data and empty Array for items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}`)
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

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy ', async () => {
      await blogTestManager.createSeveralBlogs(5);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}?sortBy=ert`)
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
      await blogTestManager.createSeveralBlogs(5);

      const response = await request(app.getHttpServer())
        .get(
          `/${BLOGS_API_PATH}?sortBy=name&sortDirection=wer&pageSize=-2&pageNumber=dfg`,
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

    it('should response with default queries data and 1 blog', async () => {
      const blog1 = await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [blog1],
      });
    });

    it('should response with default queries data and 3 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(3);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: blogs,
      });
    });

    it('should response with default queries and 10 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(15);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 15,
        items: blogs.slice(0, 10),
      });
      expect(response.body.items.length).toBe(10);
    });

    it('should response with queries pageSize=20 and 15 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(15);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}?pageSize=20`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 20,
        totalCount: 15,
        items: blogs,
      });
      expect(response.body.items.length).toBe(15);
    });

    it('should response with queries pageSize=20 sortDirection=asc and 15 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(15);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}?pageSize=20&sortDirection=asc`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 20,
        totalCount: 15,
        items: blogs.reverse(),
      });
      expect(response.body.items.length).toBe(15);
    });

    it('should response with queries pageSize=3 pageNumber=4 sortDirection=asc and 3 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(15);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}?pageSize=3&pageNumber=4&sortDirection=asc`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 5,
        page: 4,
        pageSize: 3,
        totalCount: 15,
        items: blogs.reverse().slice(9, 12),
      });
      expect(response.body.items.length).toBe(3);
    });

    it('should response with queries sortDirection=asc searchNameTerm=2 and 2 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(15);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}?sortDirection=asc&searchNameTerm=2`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 2,
        items: blogs.reverse().filter((blog) => blog.name.includes('2')),
      });
      expect(response.body.items.length).toBe(2);
    });

    it('should response with queries sortBy=name and 10 blogs', async () => {
      const blogs = await blogTestManager.createSeveralBlogs(15);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}?sortBy=name`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 15,
        items: blogs
          .sort((a: BlogViewDto, b: BlogViewDto) =>
            b.name.localeCompare(a.name),
          )
          .slice(0, 10),
      });
    });
  });

  //GET /blogs/:id
  describe('Get blog by id', () => {
    it("shouldn't get blog by invalid blogId", async () => {
      await blogTestManager.createBlog(1);

      await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${invalidId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't get blog by incorrect blogId", async () => {
      await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${2345}`)
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

    it('return blog by blogId', async () => {
      const blog = await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${blog.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual(blog);
    });
  });

  //GET /blogs/:id/posts
  describe('Get posts for blog', () => {
    it('should return response with NOT_FOUND_404 for invalid blogId', async () => {
      await blogTestManager.createBlog(1);

      await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${invalidId}/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return response with BAD_REQUEST for incorrect blogId', async () => {
      await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${invalidId}/${POSTS_API_PATH.ROOT_URL}`)
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

    it('should response with default queries data and empty post array for blog', async () => {
      const blog = await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
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

    it('should response with default queries data and 1 post for blog', async () => {
      const blog = await blogTestManager.createBlog(1);
      const post = await blogTestManager.createPostForBlog(1, blog.id);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [post],
      });
      expect(response.body.items.length).toBe(1);
    });

    it('should response with BAD_REQUEST errors for sortBy, sortDirection, pageSize, pageNumber', async () => {
      const blog = await blogTestManager.createBlog(1);
      await blogTestManager.createSeveralPostsForBlog(17, blog.id);

      const response = await request(app.getHttpServer())
        .get(
          `/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}?sortBy=er&sortDirection=df&pageNumber=-4&pageSize=g`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(4);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'sortBy',
            message: expect.any(String),
          }),
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

    it('should response with default queries data and 10 post for blog', async () => {
      const blog = await blogTestManager.createBlog(1);
      const posts = await blogTestManager.createSeveralPostsForBlog(
        17,
        blog.id,
      );

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 17,
        items: posts.slice(0, 10),
      });
      expect(response.body.items.length).toBe(10);
    });

    it('should response with queries data pageSize=30, sortBy=title and 17 post for blog', async () => {
      const blog = await blogTestManager.createBlog(1);
      const posts = await blogTestManager.createSeveralPostsForBlog(
        17,
        blog.id,
      );

      const response = await request(app.getHttpServer())
        .get(
          `/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}?pageSize=30&sortBy=title`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 30,
        totalCount: 17,
        items: posts.sort((a: PostViewDto, b: PostViewDto) =>
          b.title.localeCompare(a.title),
        ),
      });
      expect(response.body.items.length).toBe(17);
    });

    it('should response with queries data pageSize=5, pageNumber=3, sortDirection=asc and 5 post for blog', async () => {
      const blog = await blogTestManager.createBlog(1);
      const posts = await blogTestManager.createSeveralPostsForBlog(
        17,
        blog.id,
      );

      const response = await request(app.getHttpServer())
        .get(
          `/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}?pageSize=5&pageNumber=3&sortDirection=asc`,
        )
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 4,
        page: 3,
        pageSize: 5,
        totalCount: 17,
        items: posts.reverse().slice(10, 15),
      });
      expect(response.body.items.length).toBe(5);
    });
  });

  //POST /blogs
  describe('Create blog', () => {
    it('should return error NOT_AUTH_401 when try to create blog', async () => {
      const blogInputDto = blogTestManager.createBlogInputDto(1);

      await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}`)
        .set('authorization', `Basic bla-bla`)
        .send(blogInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with status BAD_REQUEST_400 and error for fields name, description, websiteUrl', async () => {
      const blogInputDto = blogTestManager.createBlogInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          ...blogInputDto,
          name: getStringWithLength(16),
          description: '',
          websiteUrl: '',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(3);

      response.body.errorsMessages.forEach((error: ErrorMessage) => {
        expect(error).toHaveProperty('field');
        expect(error).toHaveProperty('message');
        expect(typeof error.field).toBe('string');
        expect(typeof error.message).toBe('string');
      });

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'description',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'websiteUrl',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields websiteUrl', async () => {
      const blogInputDto = blogTestManager.createBlogInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...blogInputDto, websiteUrl: 'sgh' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'websiteUrl',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should created and return blog', async () => {
      const blog = blogTestManager.createBlogInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(blog)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        isMembership: expect.any(Boolean),
        createdAt: expect.any(String),
        ...blog,
      } as BlogViewDto);
    });
  });

  //POST /blogs/:id/posts
  describe('Create post for blog', () => {
    it("shouldn't create post for blog without auth", async () => {
      const blog = await blogTestManager.createBlog(1);
      const postInputDto = blogTestManager.createPostForBlogInputDto(1);

      await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic bla-bla`)
        .send(postInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't create post for blog with incorrect blogId", async () => {
      await blogTestManager.createBlog(1);
      const postInputDto = blogTestManager.createPostForBlogInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}/${345}/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDto)
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

    it("shouldn't create post for blog with invalid blogId", async () => {
      await blogTestManager.createBlog(1);
      const postInputDto = blogTestManager.createPostForBlogInputDto(1);

      await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}/${invalidId}/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return response BAD_REQUEST_400 with fields title, content, shortDescription', async () => {
      const blog = await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ title: '', content: '', shortDescription: '' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(3);

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
            field: 'content',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'shortDescription',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response BAD_REQUEST_400 with fields content', async () => {
      const blog = await blogTestManager.createBlog(1);
      const post = blogTestManager.createPostForBlogInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...post, content: getStringWithLength(1001) })
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

    it('should create post for blog by blogId', async () => {
      const blog = await blogTestManager.createBlog(1);
      const postInputDto = blogTestManager.createPostForBlogInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${BLOGS_API_PATH}/${blog.id}/${POSTS_API_PATH.ROOT_URL}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(postInputDto)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        blogId: blog.id,
        blogName: blog.name,
        ...postInputDto,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
          newestLikes: [],
        },
      } as PostViewDto);
    });
  });

  //PUT /blogs/:id
  describe('Update blog', () => {
    it("shouldn't update blog without auth", async () => {
      const blog = await blogTestManager.createBlog(1);
      const blogUpdateInputDto = blogTestManager.createBlogInputDto(2);

      await request(app.getHttpServer())
        .put(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic bla-bla`)
        .send(blogUpdateInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't update blog with invalid blogId", async () => {
      await blogTestManager.createBlog(1);
      const blogUpdateInputDto = blogTestManager.createBlogInputDto(2);

      await request(app.getHttpServer())
        .put(`/${BLOGS_API_PATH}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(blogUpdateInputDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't update blog with incorrect blogId", async () => {
      await blogTestManager.createBlog(1);
      const blogUpdateInputDto = blogTestManager.createBlogInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${BLOGS_API_PATH}/${345}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(blogUpdateInputDto)
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

    it('should return response with status BAD_REQUEST_400 and error for fields name, websiteUrl', async () => {
      const blog = await blogTestManager.createBlog(1);
      const blogUpdateInputDto = blogTestManager.createBlogInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...blogUpdateInputDto, name: '', websiteUrl: '' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'websiteUrl',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and error for fields name', async () => {
      const blog = await blogTestManager.createBlog(1);
      const blogUpdateInputDto = blogTestManager.createBlogInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...blogUpdateInputDto, name: getStringWithLength(16) })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should update blog', async () => {
      const blog = await blogTestManager.createBlog(1);
      const blogUpdateInputDto = blogTestManager.createBlogInputDto(2);

      await request(app.getHttpServer())
        .put(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(blogUpdateInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${BLOGS_API_PATH}/${blog.id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({ ...blog, ...blogUpdateInputDto });
    });
  });

  //DELETE /blogs/:id
  describe('Delete blog', () => {
    it("shouldn't delete blog without auth", async () => {
      const blog = await blogTestManager.createBlog(1);

      await request(app.getHttpServer())
        .delete(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't delete blog by invalid blogId", async () => {
      await blogTestManager.createBlog(1);

      await request(app.getHttpServer())
        .delete(`/${BLOGS_API_PATH}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't delete blog by incorrect blogId", async () => {
      await blogTestManager.createBlog(1);

      const response = await request(app.getHttpServer())
        .delete(`/${BLOGS_API_PATH}/${345}`)
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

    it('delete blog by blogId', async () => {
      const blog = await blogTestManager.createBlog(1);

      await request(app.getHttpServer())
        .delete(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .delete(`/${BLOGS_API_PATH}/${blog.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
