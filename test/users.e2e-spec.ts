import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { appSetup } from '../src/setup/app.setup';
import request from 'supertest';
import { USERS_API_PATH } from '../src/constants';
import {
  authBasic,
  deleteAllData,
  ErrorMessage,
  invalidId,
  UserTestManager,
  getStringWithLength,
} from './helpers';
import { AppModule } from '../src/app.module';
import { UserViewDto } from '../src/features/user-accounts';

describe('Users controller (e2e)', () => {
  let app: INestApplication;
  let userTestManager: UserTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    appSetup(app);

    await app.init();

    userTestManager = new UserTestManager(app);

    await deleteAllData(app);
  });

  afterEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  //GET /users
  describe('Get users', () => {
    it('should return error UNAUTHORIZED_401 when try to get users', async () => {
      await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with default queries data and empty Array for items users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
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

    it('should response with default queries data and 1 user', async () => {
      const { user } = await userTestManager.createUser(1);

      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [user],
      });
    });

    it('should response with default queries data and 5 user', async () => {
      const users = await userTestManager.createSeveralUsers(5);

      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 5,
        items: users,
      });
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy ', async () => {
      await userTestManager.createSeveralUsers(5);

      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}?sortBy=ert`)
        .set('authorization', `Basic ${authBasic}`)
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

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy, sortDirection ', async () => {
      await userTestManager.createSeveralUsers(5);

      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}?sortBy=ert&sortDirection=ed`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

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
        ]),
      );
    });

    it('should response with status BAD_REQUEST_400 and validation errors for sortBy, sortDirection, pageSize and pageNumber ', async () => {
      await userTestManager.createSeveralUsers(5);

      const response = await request(app.getHttpServer())
        .get(
          `/${USERS_API_PATH}?sortBy=ert&sortDirection=ed&pageSize=-4&pageNumber=-2`,
        )
        .set('authorization', `Basic ${authBasic}`)
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
            field: 'pageNumber',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageSize',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with status BAD_REQUEST_400 and validation errors for pageSize and pageNumber ', async () => {
      await userTestManager.createSeveralUsers(5);

      const response = await request(app.getHttpServer())
        .get(
          `/${USERS_API_PATH}?sortBy=login&sortDirection=desc&pageSize=qwe&pageNumber=aa`,
        )
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'pageNumber',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'pageSize',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should response with queries pageSize=4 pageNumber=2', async () => {
      const users = await userTestManager.createSeveralUsers(20);

      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}?pageSize=4&pageNumber=2`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 5,
        page: 2,
        pageSize: 4,
        totalCount: 20,
        items: users.slice(4, 8),
      });
      expect(response.body.items.length).toBe(4);
    }, 15000);

    it('should response with queries searchLoginTerm=2 searchEmailTerm=4 and 3 users', async () => {
      const users = await userTestManager.createSeveralUsers(12);

      const response = await request(app.getHttpServer())
        .get(`/${USERS_API_PATH}?searchLoginTerm=2&searchEmailTerm=4`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 3,
        items: users.filter(
          (u: UserViewDto) => u.login.includes('2') || u.email.includes('4'),
        ),
      });
      expect(response.body.items.length).toBe(3);
    });
  });

  //POST: /users
  describe('Create user ', () => {
    it('should return error UNAUTHORIZED_401 when try to create user', async () => {
      const userInputDto = userTestManager.createUserInputDto(1);

      await request(app.getHttpServer())
        .post(`/${USERS_API_PATH}`)
        .set('authorization', `Basic bla-bla`)
        .send(userInputDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with status BAD_REQUEST_400 and validation errors for fields login, password, email', async () => {
      const response = await request(app.getHttpServer())
        .post(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({
          login: getStringWithLength(2),
          password: '',
          email: getStringWithLength(16),
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
            field: 'login',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'password',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and validation errors for fields email', async () => {
      const userInputDto = userTestManager.createUserInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...userInputDto, email: 'email.com' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and not unique error for fields login, but email also not unique', async () => {
      const { user: user1 } = await userTestManager.createUser(1);
      const user2 = userTestManager.createUserInputDto(2);

      const response = await request(app.getHttpServer())
        .post(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...user2, login: user1.login, email: user1.email })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'login',
            message: 'not unique',
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 and not unique error for fields email', async () => {
      const { user: user1 } = await userTestManager.createUser(1);
      const user2 = userTestManager.createUserInputDto(2);

      const response = await request(app.getHttpServer())
        .post(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send({ ...user2, email: user1.email })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'not unique',
          }),
        ]),
      );
    });

    it('should created and return user', async () => {
      const user = userTestManager.createUserInputDto(1);

      const response = await request(app.getHttpServer())
        .post(`/${USERS_API_PATH}`)
        .set('authorization', `Basic ${authBasic}`)
        .send(user)
        .expect(HttpStatus.CREATED);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        login: user.login,
        email: user.email,
      } as UserViewDto);
    });
  });

  //DELETE: /users/:id
  describe('Delete user', () => {
    it("shouldn't delete user without auth", async () => {
      const { user } = await userTestManager.createUser(1);

      await request(app.getHttpServer())
        .delete(`/${USERS_API_PATH}/${user.id}`)
        .set('authorization', `Basic bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("shouldn't delete user by invalid userId", async () => {
      await userTestManager.createUser(1);

      await request(app.getHttpServer())
        .delete(`/${USERS_API_PATH}/${invalidId}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it("shouldn't delete user by invalid format userId", async () => {
      await userTestManager.createUser(1);

      const response = await request(app.getHttpServer())
        .delete(`/${USERS_API_PATH}/${123}`)
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

    it('delete user by userId', async () => {
      const { user } = await userTestManager.createUser(1);

      await request(app.getHttpServer())
        .delete(`/${USERS_API_PATH}/${user.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it("shouldn't delete user if user was deleted before", async () => {
      const { user } = await userTestManager.createUser(1);

      await request(app.getHttpServer())
        .delete(`/${USERS_API_PATH}/${user.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .delete(`/${USERS_API_PATH}/${user.id}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
