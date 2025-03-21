import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './features/testing';
import { BloggersPlatformModule } from './features/bloggers-platform';
import { UserAccountsModule } from './features/user-accounts';
import { UtilitiesApplicationModule } from './features/service';
import { SETTINGS } from './settings';
import { UserIdMiddleware } from './core';

//TODO path for DB put into env or config module
@Module({
  imports: [
    MongooseModule.forRoot(SETTINGS.MONGO_URL, {
      dbName: SETTINGS.DB_NAME,
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    UtilitiesApplicationModule,
  ],
  providers: [UtilitiesApplicationModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserIdMiddleware).forRoutes('*');
  }
}
