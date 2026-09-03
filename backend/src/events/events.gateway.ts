import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinQuery')
  handleJoinQuery(client: Socket, queryId: string) {
    client.join(`query:${queryId}`);
    return { event: 'joinedQuery', data: queryId };
  }

  notifyQueryCompleted(queryId: string, data: any) {
    this.server.to(`query:${queryId}`).emit('queryCompleted', {
      type: 'queryCompleted',
      queryId,
      ...data,
    });
  }

  notifyClarification(queryId: string, clarification: string) {
    this.server.to(`query:${queryId}`).emit('clarification', {
      type: 'clarification',
      queryId,
      content: clarification,
    });
  }

  notifyStatus(queryId: string, status: string) {
    this.server.to(`query:${queryId}`).emit('statusUpdate', {
      type: 'statusUpdate',
      queryId,
      status,
    });
  }
}
