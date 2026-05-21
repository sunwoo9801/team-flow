import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token =
      (client.handshake.auth as { token?: string }).token ??
      (client.handshake.headers.authorization as string | undefined)?.split(
        ' ',
      )[1];

    if (!token) return false;

    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      (client.data as { userId: string; email: string }).userId = payload.sub;
      (client.data as { userId: string; email: string }).email = payload.email;
      return true;
    } catch {
      return false;
    }
  }
}
