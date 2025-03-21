import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ObjectIdValidationTransformationPipe } from '../core';
import { useContainer } from 'class-validator';
import { AppModule } from '../app.module';

export function pipesSetup(app: INestApplication) {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalPipes(
    new ObjectIdValidationTransformationPipe(),
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,

      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((err) => ({
          field: err.property,
          message: Object.values(err.constraints || {})[0],
        }));

        return new BadRequestException({
          errorsMessages: formattedErrors,
        });
      },
    }),
  );
}
