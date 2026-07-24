import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Inject, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';

export interface BoardEvent {
  type:
    | 'card:moved'
    | 'card:created'
    | 'card:updated'
    | 'card:deleted'
    | 'column:moved'
    | 'column:created'
    | 'column:updated'
    | 'column:deleted'
    | 'comment:created'
    | 'comment:deleted'
    | 'attachment:created'
    | 'attachment:deleted'
    | 'label:created'
    | 'label:updated'
    | 'label:deleted'
    | 'board:restored';
  payload: unknown;
  userId: string;
}

interface AuthSocket extends Socket {
  data: {
    userId?: string;
    email?: string;
    [key: string]: unknown;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'boards',
})
export class BoardGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // userId → Set<socketId> (한 유저가 여러 탭 오픈 가능)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    @Inject(JwtService)
    private readonly jwt: JwtService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  // 연결 시점에 JWT 검증 → socket.data.userId 세팅
  afterInit(server: Server) {
    server.use((socket: AuthSocket, next) => {
      const token =
        (socket.handshake.auth as { token?: string }).token ??
        (socket.handshake.headers.authorization as string | undefined)?.split(' ')[1];

      if (!token) return next(new Error('Unauthorized'));

      try {
        const payload = this.jwt.verify<{ sub: string; email: string }>(token, {
          secret: this.config.getOrThrow<string>('JWT_SECRET'),
        });
        socket.data.userId = payload.sub;
        socket.data.email = payload.email;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: AuthSocket) {
    const userId = client.data?.userId;
    if (!userId) return;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    console.log(`WS connected: ${client.id} (user: ${userId})`);
  }

  handleDisconnect(client: AuthSocket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
    console.log(`WS disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('board:join')
  handleJoin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { boardId: string },
  ) {
    client.join(`board:${data.boardId}`);
    return { event: 'board:joined', data: { boardId: data.boardId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('board:leave')
  handleLeave(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { boardId: string },
  ) {
    client.leave(`board:${data.boardId}`);
    return { event: 'board:left', data: { boardId: data.boardId } };
  }

  // 실시간 커서 위치 공유 — 클라이언트가 throttle해서 보내므로 서버는 같은 방에만 relay
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { boardId: string; x: number; y: number; name: string },
  ) {
    client.to(`board:${data.boardId}`).emit('cursor:move', {
      userId: client.data.userId,
      name: data.name,
      x: data.x,
      y: data.y,
    });
  }

  // 보드 전체 브로드캐스트 (서비스에서 호출)
  broadcastToBoard(
    boardId: string,
    event: BoardEvent,
    excludeSocketId?: string,
  ) {
    if (excludeSocketId) {
      this.server
        .to(`board:${boardId}`)
        .except(excludeSocketId)
        .emit('board:update', event);
    } else {
      this.server.to(`board:${boardId}`).emit('board:update', event);
    }
  }

  // 특정 유저에게만 push (알림)
  emitToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
