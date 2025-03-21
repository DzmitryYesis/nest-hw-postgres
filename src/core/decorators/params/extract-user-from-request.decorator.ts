import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();

    const userId = request.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'There is no user in the request object!',
      );
    }

    return userId;
  },
);
