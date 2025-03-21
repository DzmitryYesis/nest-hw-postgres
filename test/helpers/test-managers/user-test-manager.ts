import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  LoginInputDto,
  LoginViewDto,
  UserInputDto,
  UserViewDto,
} from '../../../src/features/user-accounts';
import request from 'supertest';
import { AUTH_API_PATH, USERS_API_PATH } from '../../../src/constants';
import { delay } from '../functions';
import { mockMailService } from '../mocks';

export class UserTestManager {
  constructor(private app: INestApplication) {}

  public createUserInputDto(index: number): UserInputDto {
    return {
      login: `login_${index}`,
      password: `password_${index}`,
      email: `email${index}@gmail.com`,
    };
  }

  async createUser(
    index: number,
    statusCode = HttpStatus.CREATED,
  ): Promise<{ user: UserViewDto; password: string }> {
    const userInputDto = this.createUserInputDto(index);

    const response = await request(this.app.getHttpServer())
      .post(`/${USERS_API_PATH}`)
      .send(userInputDto)
      .auth('admin', 'qwerty')
      .expect(statusCode);

    return { user: response.body, password: userInputDto.password };
  }

  async createSeveralUsers(index: number): Promise<UserViewDto[]> {
    const users = [] as UserViewDto[];

    for (let i = 1; i <= index; i++) {
      await delay(50);
      const { user } = await this.createUser(i);
      users.unshift(user);
    }

    return users;
  }

  async registeredUser(index: number): Promise<UserInputDto> {
    const userInputDto = this.createUserInputDto(index);

    await request(this.app.getHttpServer())
      .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.REGISTRATION}`)
      .send(userInputDto)
      .expect(HttpStatus.NO_CONTENT);

    return userInputDto;
  }

  async getUserRecoveryPasswordCode(
    index: number,
  ): Promise<{ user: UserInputDto; recoveryPasswordCode: string }> {
    const user = await this.registeredUser(index);

    await request(this.app.getHttpServer())
      .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.PASSWORD_RECOVERY}`)
      .send({ email: user.email })
      .expect(HttpStatus.NO_CONTENT);

    expect(
      mockMailService.sendEmailWithRecoveryPasswordCode,
    ).toHaveBeenCalledTimes(1);

    const recoveryPasswordCode =
      mockMailService.sendEmailWithRecoveryPasswordCode.mock.calls[0][0].code;

    return { user, recoveryPasswordCode };
  }

  async loggedInUser(index: number): Promise<{
    user: UserViewDto;
    accessToken: string;
    refreshToken: string | undefined;
  }> {
    const { user, password } = await this.createUser(index);

    const response = await request(this.app.getHttpServer())
      .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
      .send({ loginOrEmail: user.login, password: password } as LoginInputDto)
      .expect(HttpStatus.OK);

    const { accessToken } = response.body as LoginViewDto;

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const refreshToken = cookies.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    return { user, accessToken, refreshToken };
  }

  async loggedInWithDevice(
    loginOrEmail: string,
    password: string,
    deviceName: string = 'Default device',
  ): Promise<{
    accessToken: string;
    refreshToken: string | undefined;
  }> {
    const response = await request(this.app.getHttpServer())
      .post(`/${AUTH_API_PATH.ROOT_URL}/${AUTH_API_PATH.LOGIN}`)
      .set('User-Agent', deviceName)
      .send({ loginOrEmail, password } as LoginInputDto)
      .expect(HttpStatus.OK);

    const { accessToken } = response.body as LoginViewDto;

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const refreshToken = cookies.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    return { accessToken, refreshToken };
  }
}
