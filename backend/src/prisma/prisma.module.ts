import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — 모든 모듈에서 별도 import 없이 PrismaService 주입 가능
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
