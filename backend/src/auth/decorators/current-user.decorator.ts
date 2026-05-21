import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// ✅ import type으로 변경
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user: Record<string, unknown> }>();
    return field ? req.user?.[field] : req.user;
  },
);
