import { INestApplication } from '@nestjs/common';
import { corsSetup } from './cors.setup';
import { pipesSetup } from './pipes.setup';
import { cookiesSetup } from './cookies.setup';

export function appSetup(app: INestApplication): void {
  pipesSetup(app);
  corsSetup(app);
  cookiesSetup(app);
}
