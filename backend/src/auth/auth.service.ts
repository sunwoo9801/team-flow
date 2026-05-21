import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from '../../generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashed,
        provider: AuthProvider.local,
      },
    });
    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    return this.generateTokens(user.id, user.email);
  }

  async googleLogin(googleUser: {
    email: string;
    name: string;
  }): Promise<TokenPair> {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          provider: AuthProvider.google,
        },
      });
    }
    return this.generateTokens(user.id, user.email);
  }

  async refresh(userId: string, rawRefreshToken: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }
    const match = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!match) {
      throw new UnauthorizedException('Refresh token이 일치하지 않습니다.');
    }
    return this.generateTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefresh },
    });
    return { accessToken, refreshToken };
  }
}
