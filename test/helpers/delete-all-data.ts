import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DELETE_ALL_API_PATH } from '../../src/constants';

export const deleteAllData = async (app: INestApplication) => {
  return request(app.getHttpServer())
    .delete(
      `/${DELETE_ALL_API_PATH.ROOT_URL}/${DELETE_ALL_API_PATH.DELETE_ALL_DATA}`,
    )
    .expect(HttpStatus.NO_CONTENT);
};
