import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserPayload {
  userId: number;
  username: string;
  role: string;
  [key: string]: unknown;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: UserPayload }>();
    const user = request.user;
    return data ? (data ? user?.[data as keyof UserPayload] : user) : user;
  },
);
