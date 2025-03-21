import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  BlogTestManager,
  PostTestManager,
  UserTestManager,
} from './helpers/test-managers';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import { deleteAllData, getStringWithLength, invalidId } from './helpers';
import request from 'supertest';
import { COMMENTS_API_PATH, UserLikeStatus } from '../src/constants';
import {
  CommentInputDto,
  CommentViewDto,
} from '../src/features/bloggers-platform/comment';
import { BaseLikeStatusInputDto } from '../src/core/dto';

describe('Comments controller (e2e)', () => {
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

  //GET /comments
  describe('Get comments', () => {
    it('should return response with error NOT_FOUND_404 for invalid id', async () => {
      await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${invalidId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return response with error BAD_REQUEST for incorrect id', async () => {
      await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${324}`)
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

    it('should return comment by commentId', async () => {
      const { comments } = await postTestManager.createSeveralCommentsForPost(
        1,
        1,
      );

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual(comments[0]);
    });
  });

  //PUT /comments/:id
  describe('Update comments by ID', () => {
    it("shouldn't update comment without auth", async () => {
      const { comments } = await postTestManager.createSeveralCommentsForPost(
        1,
        1,
      );
      const commentInputDto = postTestManager.createCommentForPostInputDto(2);

      await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Basic bla-bla`)
        .send(commentInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't update comment by invalid commentId", async () => {
      const { accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);
      const commentInputDto = postTestManager.createCommentForPostInputDto(2);

      await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${invalidId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(commentInputDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't update comment by incorrect commentId", async () => {
      const { accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);
      const commentInputDto = postTestManager.createCommentForPostInputDto(2);

      const response = await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${345}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(commentInputDto)
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

    it("shouldn't update comment by other user", async () => {
      const { comments } = await postTestManager.createSeveralCommentsForPost(
        1,
        1,
      );
      const commentInputDto = postTestManager.createCommentForPostInputDto(2);

      const { accessToken: accessTokenUser2 } =
        await userTestManager.loggedInUser(2);

      await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send(commentInputDto)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return response with error BAD_REQUEST_400 for small content length', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
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

    it('should return response with error BAD_REQUEST_400 for large content length', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
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

    it('should update comment', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);
      const commentUpdateDto = postTestManager.createCommentForPostInputDto(2);

      await request(app.getHttpServer())
        .put(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(commentUpdateDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        ...comments[0],
        content: commentUpdateDto.content,
      } as CommentInputDto);
    });
  });

  //PUT /comments/:id/like-status
  describe('Change like status', () => {
    it('should return response with error NOT_AUTH for like comment request', async () => {
      const { comments } = await postTestManager.createSeveralCommentsForPost(
        1,
        1,
      );

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${'bla-bla-token'}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with error NOT_FOUND for like comment request', async () => {
      const { accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${invalidId}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return response with error BAD_REQUEST for like comment request with incorrect id', async () => {
      const { accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${345}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
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

    it('should return response with error BAD_REQUEST when send likeStatus: `` for like comment request', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
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

    it('should return response with error BAD_REQUEST when send likeStatus: wrong format', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'lliikkee' })
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

    it('should add like for comment', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: comments[0].id,
        content: comments[0].content,
        createdAt: comments[0].createdAt,
        commentatorInfo: comments[0].commentatorInfo,
        likesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.LIKE,
        },
      } as CommentViewDto);
    });

    it('should add like for comment and show myStatus: None for non auth user', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: comments[0].id,
        content: comments[0].content,
        createdAt: comments[0].createdAt,
        commentatorInfo: comments[0].commentatorInfo,
        likesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.NONE,
        },
      } as CommentViewDto);
    });

    it('should add like, then dislike for comment and show myStatus: dislike for user', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: comments[0].id,
        content: comments[0].content,
        createdAt: comments[0].createdAt,
        commentatorInfo: comments[0].commentatorInfo,
        likesInfo: {
          likesCount: 0,
          dislikesCount: 1,
          myStatus: UserLikeStatus.DISLIKE,
        },
      } as CommentViewDto);
    });

    it('should add like, then dislike for comment and show myStatus: None for non auth user', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: comments[0].id,
        content: comments[0].content,
        createdAt: comments[0].createdAt,
        commentatorInfo: comments[0].commentatorInfo,
        likesInfo: {
          likesCount: 0,
          dislikesCount: 1,
          myStatus: UserLikeStatus.NONE,
        },
      } as CommentViewDto);
    });

    it('should add like, then like for comment and show myStatus: Like for user', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: comments[0].id,
        content: comments[0].content,
        createdAt: comments[0].createdAt,
        commentatorInfo: comments[0].commentatorInfo,
        likesInfo: {
          likesCount: 1,
          dislikesCount: 0,
          myStatus: UserLikeStatus.LIKE,
        },
      } as CommentViewDto);
    });

    it('should add like from user1, then dislike from user2, show myStatus: Like for user1 and dislike for user2', async () => {
      const { comments, accessToken: accessTokenUser1 } =
        await postTestManager.createSeveralCommentsForPost(1, 1);
      const { accessToken: accessTokenUser2 } =
        await userTestManager.loggedInUser(2);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .put(
          `/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}/${COMMENTS_API_PATH.LIKE_STATUS}`,
        )
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Dislike' } as BaseLikeStatusInputDto)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessTokenUser1}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: comments[0].id,
        content: comments[0].content,
        createdAt: comments[0].createdAt,
        commentatorInfo: comments[0].commentatorInfo,
        likesInfo: {
          likesCount: 1,
          dislikesCount: 1,
          myStatus: UserLikeStatus.LIKE,
        },
      } as CommentViewDto);
    });
  });

  //DELETE /comments/:id
  describe('Delete comment', () => {
    it("shouldn't delete comment without auth", async () => {
      const { comments } = await postTestManager.createSeveralCommentsForPost(
        1,
        1,
      );

      await request(app.getHttpServer())
        .delete(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't delete comment by invalid commentId", async () => {
      const { accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .delete(`/${COMMENTS_API_PATH.ROOT_URL}/${invalidId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't delete comment by incorrect commentId", async () => {
      const { accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      const response = await request(app.getHttpServer())
        .delete(`/${COMMENTS_API_PATH.ROOT_URL}/${345}`)
        .set('authorization', `Bearer ${accessToken}`)
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

    it("shouldn't delete comment by other user", async () => {
      const { comments } = await postTestManager.createSeveralCommentsForPost(
        1,
        1,
      );

      const { accessToken: accessTokenUser2 } =
        await userTestManager.loggedInUser(2);

      await request(app.getHttpServer())
        .delete(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessTokenUser2}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should delete comment by commentId', async () => {
      const { comments, accessToken } =
        await postTestManager.createSeveralCommentsForPost(1, 1);

      await request(app.getHttpServer())
        .delete(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .get(`/${COMMENTS_API_PATH.ROOT_URL}/${comments[0].id}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
