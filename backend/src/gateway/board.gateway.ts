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

  private userSocketMap = new Map<string, string[]>(); // userId → socketId[]

  handleConnection(client: Socket) {
    console.log(`WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string }).userId;
    if (userId) {
      const sockets = this.userSocketMap.get(userId) ?? [];
      this.userSocketMap.set(
        userId,
        sockets.filter((id) => id !== client.id),
      );
    }
    console.log(`WS disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('board:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    client.join(`board:${data.boardId}`);
    const userId = (client.data as { userId: string }).userId;
    const existing = this.userSocketMap.get(userId) ?? [];
    this.userSocketMap.set(userId, [...existing, client.id]);
    return { event: 'board:joined', data: { boardId: data.boardId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('board:leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    client.leave(`board:${data.boardId}`);
    return { event: 'board:left', data: { boardId: data.boardId } };
  }

  // 서버 → 클라이언트 브로드캐스트 (서비스에서 호출)
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
}
