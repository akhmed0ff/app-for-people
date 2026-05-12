import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../../../modules/auth/auth.types';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
  return request.user;
});
