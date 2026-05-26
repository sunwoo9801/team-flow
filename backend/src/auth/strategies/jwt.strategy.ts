import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    // ✅ 핵심: ConfigService가 반드시 첫 번째 파라미터여야 함
    @Inject(ConfigService)
    private readonly config: ConfigService,

    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {
    // ✅ super() 안에서 config를 직접 쓰지 않고
    //    process.env로 대체 — DI 완료 전 접근 방지
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new UnauthorizedException();
    return { sub: user.id, email: user.email, name: user.name };
  }
}
