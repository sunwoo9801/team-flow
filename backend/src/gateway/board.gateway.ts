import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
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
    | 'column:deleted';
  payload: unknown;
  userId: string;
}

interface AuthSocket extends Socket {
  user?: { sub: string; email: string };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'boards',
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // userId → Set<socketId> (한 유저가 여러 탭 오픈 가능)
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: AuthSocket) {
    const userId = client.user?.sub;
    if (!userId) return;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    console.log(`WS connected: ${client.id} (user: ${userId})`);
  }

  handleDisconnect(client: AuthSocket) {
    const userId = client.user?.sub;
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
