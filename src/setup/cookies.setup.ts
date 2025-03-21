import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';

export function cookiesSetup(app: INestApplication) {
  app.use(cookieParser());
}
