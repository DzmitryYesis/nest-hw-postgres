import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SETTINGS } from './settings';
import { appSetup } from './setup/app.setup';

//TODO Passport js
//TODO UseCases
//TODO Passport strategy for middleware
//TODO evn for all projects + for tests add url for db
//TODO class for errors in service and repository
//TODO try to find best practise to add refresh token to cookie
//TODO change type for deviceId to ObjectId not string
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app);

  await app.listen(SETTINGS.PORT, () => {
    console.log(`...server started in port ${SETTINGS.PORT}`);
  });
}

bootstrap();
