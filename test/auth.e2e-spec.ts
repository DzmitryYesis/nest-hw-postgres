import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  UserTestManager,
  deleteAllData,
  authBasic,
  getStringWithLength,
  ErrorMessage,
  mockMailService,
  invalidCode,
  invalidRefreshToken,
} from './helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import request from 'supertest';
import { AUTH_API_PATH } from '../src/constants';
import {
  ChangePasswordInputDto,
  LoginViewDto,
  ResendConfirmationCodeInputDto,
  UserInfoViewDto,
} from '../src/features/user-accounts';
import { EmailNotificationService } from '../src/features/service';

//TODO registration-confirmation test for expired confirmation code
//TODO registration-email-resending test for expired confirmation code
//TODO new-password test for expired recoveryCode
//TODO refactoring email service to add ability to add props on service
describe('Auth controller (e2e)', () => {
  let app: INestApplication;
  let userTestManager: UserTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailNotificationService)
      .useValue(mockMailService)
      .compile();

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

  //GET /auth/me
  describe('Get user info', () => {
    it('should return response with UNAUTHORIZED_401 error', async () => {
      await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .get(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.ME}`)
        .set('authorization', `Bearer bla-bla`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with UNAUTHORIZED_401 error if try logged in with basic auth', async () => {
      await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .get(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.ME}`)
        .set('authorization', `Basic ${authBasic}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with info about user', async () => {
      const { user, accessToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .get(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.ME}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toStrictEqual({
        login: user.login,
        email: user.email,
        userId: user.id,
      } as unknown as UserInfoViewDto);
    });
  });

  //POST /auth/login
  describe('Login user', () => {
    it('should return response with error BAD_REQUEST_400 for filed loginOrEmail', async () => {
      const { password } = await userTestManager.createUser(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: '', password })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'loginOrEmail',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error BAD_REQUEST_400 for filed password', async () => {
      const { user } = await userTestManager.createUser(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.login, password: 2 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with error NOT_AUTH_401 if send incorrect valid login', async () => {
      const { user, password } = await userTestManager.createUser(1);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.login + '1', password })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with error NOT_AUTH_401 if send incorrect valid email', async () => {
      const { user, password } = await userTestManager.createUser(1);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.email + '1', password })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with accessToken in body and refreshToken in cookie', async () => {
      const { user, password } = await userTestManager.createUser(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.login, password })
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(response.body).toStrictEqual({
        accessToken: expect.any(String),
      } as LoginViewDto);

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const hasRefreshToken = cookies.some((cookie) =>
        cookie.startsWith('refreshToken='),
      );
      expect(hasRefreshToken).toBe(true);
    });

    it('should return work normal after 5 login request one by one', async () => {
      const { user, password } = await userTestManager.createUser(1);

      for (let i = 1; i < 6; i++) {
        await request(app.getHttpServer())
          .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
          .send({ loginOrEmail: user.login, password })
          .expect(HttpStatus.OK);
      }
    });

    //TODO add test for 429 error status
    /*it('should return error TY_MANY_REQUEST after 6 login one by one', async () => {
      const { user, password } = await userTestManager.createUser(1);

      for (let i = 1; i < 6; i++) {
        await request(app.getHttpServer())
          .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
          .send({ loginOrEmail: user.login, password })
          .expect(HttpStatus.OK);
      }

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.login, password })
        .expect(HttpStatus.TOO_MANY_REQUESTS);
    });*/
  });

  //POST /auth/registration
  describe('Registration user', () => {
    it('should return response with status BAD_REQUEST_400 and validation errors for fields login, password, email', async () => {
      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION}`)
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

    it('should return response with status BAD_REQUEST_400 and validation errors for fields password, email', async () => {
      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION}`)
        .send({
          login: getStringWithLength(4),
          password: getStringWithLength(2),
          email: getStringWithLength(16),
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
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

    it('should return response with status BAD_REQUEST_400 and not unique error for fields login, but email also not unique', async () => {
      const { user: user1 } = await userTestManager.createUser(1);
      const user2 = userTestManager.createUserInputDto(2);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION}`)
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
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION}`)
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

    it('should return response with status NO_CONTENT_204', async () => {
      const userInputDto = userTestManager.createUserInputDto(1);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION}`)
        .send(userInputDto)
        .expect(HttpStatus.NO_CONTENT);
    });

    //TODO add test for 429 status
    /*it('should return work normal after 5 registration request one by one', async () => {
      for (let i = 1; i < 6; i++) {
        const user = createUserInputBody(i);

        await req
          .post(`${SETTINGS.PATH.AUTH}/registration`)
          .send(user)
          .expect(HttpStatusCodeEnum.NO_CONTENT_204);
      }
    });

    it('should return error TY_MANY_REQUEST after 6 registration one by one', async () => {
      const user = createUserInputBody(6);

      for (let i = 1; i < 6; i++) {
        const userI = createUserInputBody(i);
        await req
          .post(`${SETTINGS.PATH.AUTH}/registration`)
          .send(userI)
          .expect(HttpStatusCodeEnum.NO_CONTENT_204);
      }

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration`)
        .send(user)
        .expect(HttpStatusCodeEnum.TO_MANY_REQUESTS);
    });*/
  });

  //POST /auth/registration-confirmation
  describe('Registration confirmation user', () => {
    beforeEach(async () => {
      mockMailService.sendEmailWithConfirmationCode.mockClear();
    });

    it('should return response with status BAD_REQUEST_400 for invalid code', async () => {
      await userTestManager.registeredUser(1);

      expect(
        mockMailService.sendEmailWithConfirmationCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCode =
        mockMailService.sendEmailWithConfirmationCode.mock.calls[0][0].code;

      expect(confirmationCode).toBeDefined();

      const response = await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_CONFIRMATION}`,
        )
        .send({ code: invalidCode })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'code',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should confirmed user email', async () => {
      await userTestManager.registeredUser(1);

      expect(
        mockMailService.sendEmailWithConfirmationCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCode =
        mockMailService.sendEmailWithConfirmationCode.mock.calls[0][0].code;

      expect(confirmationCode).toBeDefined();

      await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_CONFIRMATION}`,
        )
        .send({ code: confirmationCode })
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return response with status BAD_REQUEST_400 when user already confirmed', async () => {
      await userTestManager.registeredUser(1);

      expect(
        mockMailService.sendEmailWithConfirmationCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCode =
        mockMailService.sendEmailWithConfirmationCode.mock.calls[0][0].code;

      expect(confirmationCode).toBeDefined();

      await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_CONFIRMATION}`,
        )
        .send({ code: confirmationCode })
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_CONFIRMATION}`,
        )
        .send({ code: confirmationCode })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'code',
            message: expect.any(String),
          }),
        ]),
      );
    });

    //TODO Add test for 429 error
    /*it('should return response with error TO_MANY_REQUESTS', async () => {
      const user = createUserInputBody(1);

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration`)
        .send(user)
        .expect(HttpStatusCodeEnum.NO_CONTENT_204);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const sentMailContent = mockSendMail.mock.calls[0][0].html;
      const confirmationCode = sentMailContent.match(/code=([\w-]+)/)?.[1];

      expect(confirmationCode).toBeDefined();

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
        .send({ code: confirmationCode })
        .expect(HttpStatusCodeEnum.NO_CONTENT_204);

      for (let i = 1; i < 5; i++) {
        await req
          .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
          .send({ code: confirmationCode })
          .expect(HttpStatusCodeEnum.BAD_REQUEST_400);
      }

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
        .send({ code: confirmationCode })
        .expect(HttpStatusCodeEnum.TO_MANY_REQUESTS);
    });*/
  });

  //POST /aut/registration-email-resending
  describe('Resend confirmation code', () => {
    beforeEach(async () => {
      mockMailService.sendEmailWithConfirmationCode.mockClear();
    });

    it('should return response with status BAD_REQUEST_400 for resend email when user send incorrect email', async () => {
      await userTestManager.registeredUser(1);

      const response = await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_EMAIL_RESENDING}`,
        )
        .send({ email: 'erert' } as ResendConfirmationCodeInputDto)
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

    it('should return response with status BAD_REQUEST_400 for resend email when user send another email', async () => {
      const userInputDto = await userTestManager.registeredUser(1);
      const anotherEmail = 'another-test@gmail.com';

      const response = await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_EMAIL_RESENDING}`,
        )
        .send({ email: anotherEmail } as ResendConfirmationCodeInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(userInputDto.email).not.toEqual(anotherEmail);
      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Some problem',
          }),
        ]),
      );
    });

    it('should return response with new confirmation code', async () => {
      const userInputDto = await userTestManager.registeredUser(1);

      expect(
        mockMailService.sendEmailWithConfirmationCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCodeAfterRegistration =
        mockMailService.sendEmailWithConfirmationCode.mock.calls[0][0].code;

      expect(confirmationCodeAfterRegistration).toBeDefined();

      await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_EMAIL_RESENDING}`,
        )
        .send({ email: userInputDto.email } as ResendConfirmationCodeInputDto)
        .expect(HttpStatus.NO_CONTENT);

      expect(
        mockMailService.sendEmailWithConfirmationCode,
      ).toHaveBeenCalledTimes(2);

      const confirmationCodeAfterResending =
        mockMailService.sendEmailWithConfirmationCode.mock.calls[0][0].code;

      expect(confirmationCodeAfterResending).toBeDefined();

      expect(confirmationCodeAfterRegistration).toEqual(
        confirmationCodeAfterResending,
      );
    });

    it('should return response with status BAD_REQUEST_400 for resend email when user already confirmed', async () => {
      const userInputDto = await userTestManager.registeredUser(1);

      expect(
        mockMailService.sendEmailWithConfirmationCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCode =
        mockMailService.sendEmailWithConfirmationCode.mock.calls[0][0].code;

      expect(confirmationCode).toBeDefined();

      await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_CONFIRMATION}`,
        )
        .send({ code: confirmationCode })
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .post(
          `/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION_EMAIL_RESENDING}`,
        )
        .send({ email: userInputDto.email })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Some problem',
          }),
        ]),
      );
    });

    //TODO test for 5 request and 6 request
    /*it('should return response with status TY_MANY_REQUEST', async () => {
      const user = createUserInputBody(1);

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration`)
        .send(user)
        .expect(HttpStatusCodeEnum.NO_CONTENT_204);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const sentMailContent = mockSendMail.mock.calls[0][0].html;
      const confirmationCode = sentMailContent.match(/code=([\w-]+)/)?.[1];

      expect(confirmationCode).toBeDefined();

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration-confirmation`)
        .send({ code: confirmationCode })
        .expect(HttpStatusCodeEnum.NO_CONTENT_204);

      for (let i = 1; i < 6; i++) {
        await req
          .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
          .send({ email: user.email })
          .expect(HttpStatusCodeEnum.BAD_REQUEST_400);
      }

      await req
        .post(`${SETTINGS.PATH.AUTH}/registration-email-resending`)
        .send({ email: user.email })
        .expect(HttpStatusCodeEnum.TO_MANY_REQUESTS);
    });*/
  });

  //POST /auth/password-recovery
  describe('Recovery password', () => {
    beforeEach(async () => {
      mockMailService.sendEmailWithRecoveryPasswordCode.mockClear();
    });

    it('should return response with status BAD_REQUEST_400 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.PASSWORD_RECOVERY}`)
        .send({ email: '' })
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

    it('should return response NO_CONTENT and send recoveryCode to email', async () => {
      const userInputDto = await userTestManager.registeredUser(1);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.PASSWORD_RECOVERY}`)
        .send({ email: userInputDto.email })
        .expect(HttpStatus.NO_CONTENT);

      expect(
        mockMailService.sendEmailWithRecoveryPasswordCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCode =
        mockMailService.sendEmailWithRecoveryPasswordCode.mock.calls[0][0].code;

      expect(confirmationCode).toBeDefined();
    });

    it('should return response NO_CONTENT and send recoveryCode for non registered user', async () => {
      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.PASSWORD_RECOVERY}`)
        .send({ email: 'test-user@gmail.com' })
        .expect(HttpStatus.NO_CONTENT);

      expect(
        mockMailService.sendEmailWithRecoveryPasswordCode,
      ).toHaveBeenCalledTimes(1);

      const confirmationCode =
        mockMailService.sendEmailWithRecoveryPasswordCode.mock.calls[0][0].code;

      expect(confirmationCode).toBeDefined();
    });

    //TODO 429 error
    /*it('should return response TY_MANY_REQUEST for password-recovery', async () => {
      for (let i = 1; i < 6; i++) {
        await req
          .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
          .send({ email: 'testemail@gmail.com' })
          .expect(HttpStatusCodeEnum.NO_CONTENT_204);
      }

      await req
        .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
        .send({ email: 'testemail@gmail.com' })
        .expect(HttpStatusCodeEnum.TO_MANY_REQUESTS);
    });*/
  });

  //POST /auth/new-password
  describe('New password', () => {
    beforeEach(async () => {
      mockMailService.sendEmailWithRecoveryPasswordCode.mockClear();
    });

    it('should return response with status BAD_REQUEST_400 for invalid new password and recovery code', async () => {
      await userTestManager.getUserRecoveryPasswordCode(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.NEW_PASSWORD}`)
        .send({
          newPassword: '23',
          recoveryCode: '',
        } as ChangePasswordInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(2);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'newPassword',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'recoveryCode',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 for invalid new password', async () => {
      const { recoveryPasswordCode } =
        await userTestManager.getUserRecoveryPasswordCode(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.NEW_PASSWORD}`)
        .send({
          newPassword: '23',
          recoveryCode: recoveryPasswordCode,
        } as ChangePasswordInputDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'newPassword',
            message: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with status BAD_REQUEST_400 for recoveryCode when send invalid code', async () => {
      await userTestManager.getUserRecoveryPasswordCode(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.NEW_PASSWORD}`)
        .send({ newPassword: 'newPassword', recoveryCode: invalidCode })
        .expect(HttpStatus.BAD_REQUEST);

      console.log(response.body);

      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      expect(response.body.errorsMessages).toHaveLength(1);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'recoveryCode',
            message: 'Some problem',
          }),
        ]),
      );
    });

    it('should update password for user', async () => {
      const { user, recoveryPasswordCode } =
        await userTestManager.getUserRecoveryPasswordCode(1);

      const newPassword = 'newPassword';

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.NEW_PASSWORD}`)
        .send({ newPassword: newPassword, recoveryCode: recoveryPasswordCode })
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.login, password: user.password })
        .expect(HttpStatus.UNAUTHORIZED);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
        .send({ loginOrEmail: user.login, password: newPassword })
        .expect(HttpStatus.OK);
    });

    //TODO 429 error
    /*it('should return response with status TY_MANY_REQUEST for new-password', async () => {
      const { user } = await createdUser(1);

      await req
        .post(`${SETTINGS.PATH.AUTH}/password-recovery`)
        .send({ email: user.email })
        .expect(HttpStatusCodeEnum.NO_CONTENT_204);

      for (let i = 1; i < 6; i++) {
        await req
          .post(`${SETTINGS.PATH.AUTH}/new-password`)
          .send({ newPassword: 'newPassword', recoveryCode: invalidCode })
          .expect(HttpStatusCodeEnum.BAD_REQUEST_400);
      }

      await req
        .post(`${SETTINGS.PATH.AUTH}/new-password`)
        .send({ newPassword: 'newPassword', recoveryCode: invalidCode })
        .expect(HttpStatusCodeEnum.TO_MANY_REQUESTS);
    });*/
  });

  //POST /auth/refresh-token
  describe('Refresh token', () => {
    it('should return response NOT_AUTH_401 error', async () => {
      await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REFRESH_TOKEN}`)
        .set('Cookie', invalidRefreshToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    /*//TODO problem with iat for refresh token
    it('should return response new accessToken and refreshToken', async () => {
      const { accessToken, refreshTokenCookie } = await loggedInUser(1);

      console.log(refreshTokenCookie);
      const { iat: iatAccessToken } =
        await jwtService.decodeAccessToken(accessToken);
      const { iat: iatRefreshToken } = await jwtService.decodeRefreshToken(
        refreshTokenCookie!.replace('refreshToken=', ''),
      );

      await sleep(3000);

      const res = await req
        .post(`${SETTINGS.PATH.AUTH}/refresh-token`)
        .set('Cookie', refreshTokenCookie!)
        .expect(HttpStatusCodeEnum.OK_200);

      console.log(res.body);

      expect(res.body).toStrictEqual({
        accessToken: expect.any(String),
      } as TLoginUser);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const newRefreshTokenCookie = cookies.find((cookie) =>
        cookie.startsWith('refreshToken='),
      );

      const { iat: newIatAccessToken } = await jwtService.decodeAccessToken(
        res.body.accessToken,
      );
      const { iat: newIatRefreshToken } = await jwtService.decodeRefreshToken(
        newRefreshTokenCookie!.replace('refreshToken=', ''),
      );

      expect(newRefreshTokenCookie).toStrictEqual(expect.any(String));
      expect(newIatAccessToken).not.toEqual(iatAccessToken);
      expect(newIatRefreshToken).not.toEqual(iatRefreshToken);
    });*/
  });

  //POST /auth/logout
  describe('Logout user', () => {
    it('should return response NOT_AUTH_401 error', async () => {
      await userTestManager.loggedInUser(1);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGOUT}`)
        .set('Cookie', invalidRefreshToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response NO_CONTENT_204 and without refreshToken', async () => {
      const { refreshToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGOUT}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.NO_CONTENT);

      const cookie =
        (response.headers['set-cookie'] as unknown as string[]) || [];
      const clearedCookie = cookie.find((cookie) =>
        cookie.startsWith('refreshToken='),
      );
      expect(clearedCookie).toBeUndefined();
    });
  });
});
