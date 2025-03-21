import { INestApplication } from '@nestjs/common';

export function corsSetup(app: INestApplication) {
  app.enableCors();
}
