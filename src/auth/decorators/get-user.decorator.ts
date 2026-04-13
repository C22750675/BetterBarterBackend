import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayloadDto } from '../dto/user-payload.dto.js';
import { RequestWithUser } from '../interfaces/request-with-user.interface.js';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayloadDto => {
    const request: RequestWithUser = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
