import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  delay,
  deleteAllData,
  invalidRefreshToken,
  UserTestManager,
} from './helpers';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { appSetup } from '../src/setup/app.setup';
import request from 'supertest';
import { AUTH_API_PATH, SECURITY_API_PATH } from '../src/constants';
import { SessionDeviceViewDto } from '../src/features/user-accounts/dto/view-dto/session-device.view-dto';

//TODO need more test for all cases
describe('Sessions controller (e2e)', () => {
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

  //GET /security/devices
  describe('Get all devices', () => {
    it('should return response with error NOT_AUTH', async () => {
      await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with error NOT_AUTH when use invalid refresh token', async () => {
      await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', invalidRefreshToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with 1 current session', async () => {
      const { refreshToken } = await userTestManager.loggedInUser(1);

      const response = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ip: expect.any(String),
            title: expect.any(String),
            lastActiveDate: expect.any(String),
            deviceId: expect.any(String),
          }),
        ]),
      );
    });

    it('should return response with 4 current sessions with different devices', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 3',
      );
      const { refreshToken } = await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 4',
      );

      const response = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);
    });

    it('should return response with 4 current sessions with different update time for device 2', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      const { refreshToken: refreshTokenCookieDevice2 } =
        await userTestManager.loggedInWithDevice(
          user.login,
          password,
          'Device 2',
        );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 3',
      );
      const { refreshToken: refreshTokenCookieDevice4 } =
        await userTestManager.loggedInWithDevice(
          user.login,
          password,
          'Device 4',
        );

      const resBeforeUpdate = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshTokenCookieDevice4!)
        .expect(HttpStatus.OK);

      console.log('4 sessions', resBeforeUpdate.body);

      expect(Array.isArray(resBeforeUpdate.body)).toBe(true);
      expect(resBeforeUpdate.body.length).toBe(4);

      const device2BeforeUpdate = resBeforeUpdate.body.find(
        (d: SessionDeviceViewDto) => d.title === 'Device 2',
      );

      await delay(4000);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REFRESH_TOKEN}`)
        .set('Cookie', refreshTokenCookieDevice2!)
        .expect(HttpStatus.OK);

      const resAfterUpdate = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshTokenCookieDevice4!)
        .expect(HttpStatus.OK);

      console.log('4 sessions after update', resAfterUpdate.body);

      expect(Array.isArray(resAfterUpdate.body)).toBe(true);
      expect(resAfterUpdate.body.length).toBe(4);

      const device2AfterUpdate = resAfterUpdate.body.find(
        (d: SessionDeviceViewDto) => d.title === 'Device 2',
      );

      expect(device2BeforeUpdate.lastActiveDate).not.toEqual(
        device2AfterUpdate.lastActiveDate,
      );
    });

    it('should return response with 3 sessions with different devices after logout device number 2', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      const { refreshToken: refreshTokenCookieDevice2 } =
        await userTestManager.loggedInWithDevice(
          user.login,
          password,
          'Device 2',
        );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 3',
      );
      const { refreshToken: refreshTokenCookieDevice4 } =
        await userTestManager.loggedInWithDevice(
          user.login,
          password,
          'Device 4',
        );

      const response = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshTokenCookieDevice4!)
        .expect(HttpStatus.OK);

      console.log(response.body);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);

      await request(app.getHttpServer())
        .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGOUT}`)
        .set('Cookie', refreshTokenCookieDevice2!)
        .expect(HttpStatus.NO_CONTENT);

      const resAfterLogoutDevice2 = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshTokenCookieDevice4!)
        .expect(HttpStatus.OK);

      console.log(resAfterLogoutDevice2.body);

      const notDevice2 = resAfterLogoutDevice2.body.every(
        (d: SessionDeviceViewDto) => d.title !== 'Device 2',
      );

      expect(Array.isArray(resAfterLogoutDevice2.body)).toBe(true);
      expect(resAfterLogoutDevice2.body.length).toBe(3);
      expect(notDevice2).toBe(true);
    });
  });

  //DELETE /security/devices
  describe('Delete devices exclude current', () => {
    it('should return error NOT_AUTH for request delete devices for invalid format refresh token', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 3',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 4',
      );

      await request(app.getHttpServer())
        .delete(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', invalidRefreshToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return error NOT_AUTH for request delete devices for request without refresh token', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 3',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 4',
      );

      await request(app.getHttpServer())
        .delete(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should delete all devices exclude current', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 3',
      );
      const { refreshToken } = await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 4',
      );

      const resGet = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(resGet.body);

      expect(Array.isArray(resGet.body)).toBe(true);
      expect(resGet.body.length).toBe(4);

      await request(app.getHttpServer())
        .delete(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.NO_CONTENT);

      const resAfterDelete = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(resAfterDelete.body);

      expect(Array.isArray(resAfterDelete.body)).toBe(true);
      expect(resAfterDelete.body.length).toBe(1);
      expect(resAfterDelete.body[0].title).toEqual('Device 4');
    });
  });

  //DELETE /security/devices/:id
  describe('Delete session by id', () => {
    it('should return response with error NOT_AUTH when try to delete device by id with invalid token', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      const { refreshToken } = await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );

      const resGet = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(resGet.body);

      expect(Array.isArray(resGet.body)).toBe(true);
      expect(resGet.body.length).toBe(2);

      const device1 = resGet.body.find(
        (d: SessionDeviceViewDto) => d.title === 'Device 1',
      ) as SessionDeviceViewDto;

      await request(app.getHttpServer())
        .delete(
          `/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}/${device1.deviceId}`,
        )
        .set('Cookie', invalidRefreshToken)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return response with error NOT_FOUND when try to delete unreal device', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      const { refreshToken } = await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );

      const resGet = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(resGet.body);

      expect(Array.isArray(resGet.body)).toBe(true);
      expect(resGet.body.length).toBe(2);

      await request(app.getHttpServer())
        .delete(
          `/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}/19c14589-bf0e-464b-93a8-dffcdc7blabla`,
        )
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete device session by device id', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      const { refreshToken } = await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );

      const resGet = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(resGet.body);

      expect(Array.isArray(resGet.body)).toBe(true);
      expect(resGet.body.length).toBe(2);

      const device1 = resGet.body.find(
        (d: SessionDeviceViewDto) => d.title === 'Device 1',
      ) as SessionDeviceViewDto;

      await request(app.getHttpServer())
        .delete(
          `/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}/${device1.deviceId}`,
        )
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return response with error NOT_FOUND when try to delete device what delete early', async () => {
      const { user, password } = await userTestManager.createUser(1);
      await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 1',
      );
      const { refreshToken } = await userTestManager.loggedInWithDevice(
        user.login,
        password,
        'Device 2',
      );

      const resGet = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.OK);

      console.log(resGet.body);

      expect(Array.isArray(resGet.body)).toBe(true);
      expect(resGet.body.length).toBe(2);

      const device1 = resGet.body.find(
        (d: SessionDeviceViewDto) => d.title === 'Device 1',
      ) as SessionDeviceViewDto;

      await request(app.getHttpServer())
        .delete(
          `/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}/${device1.deviceId}`,
        )
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .delete(
          `/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}/${device1.deviceId}`,
        )
        .set('Cookie', refreshToken!)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return response with error FORBIDDEN', async () => {
      const { user: user1, password: password1 } =
        await userTestManager.createUser(1);
      const { refreshToken: refreshTokenCookie1 } =
        await userTestManager.loggedInWithDevice(
          user1.login,
          password1,
          'Device1 1',
        );
      const { user: user2, password: password2 } =
        await userTestManager.createUser(2);
      const { refreshToken: refreshTokenCookie2 } =
        await userTestManager.loggedInWithDevice(
          user2.login,
          password2,
          'Device2 1',
        );

      const resSessionUser1 = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshTokenCookie1!)
        .expect(HttpStatus.OK);

      console.log(resSessionUser1.body);

      expect(Array.isArray(resSessionUser1.body)).toBe(true);
      expect(resSessionUser1.body.length).toBe(1);

      const resSessionUser2 = await request(app.getHttpServer())
        .get(`/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}`)
        .set('Cookie', refreshTokenCookie2!)
        .expect(HttpStatus.OK);

      console.log(resSessionUser2.body);

      expect(Array.isArray(resSessionUser2.body)).toBe(true);
      expect(resSessionUser1.body.length).toBe(1);

      const device2 = resSessionUser2.body.find(
        (d: SessionDeviceViewDto) => d.title === 'Device2 1',
      ) as SessionDeviceViewDto;

      await request(app.getHttpServer())
        .delete(
          `/${SECURITY_API_PATH.ROOT_URL}/${SECURITY_API_PATH.DEVICES}/${device2.deviceId}`,
        )
        .set('Cookie', refreshTokenCookie1!)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
