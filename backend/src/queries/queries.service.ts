import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MasService } from '../mas/mas.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class QueriesService {
  constructor(
    private authService: AuthService,
    private masService: MasService,
    private eventsGateway: EventsGateway,
  ) {}

  // Grava a pergunta e a resposta como mensagens da mesma sessão
  async create(data: { query: string; userId: string; sessionId?: string }) {
    const sessionId = data.sessionId ?? (await this.authService.createSession(data.userId)).id;

    const userMessage = await this.authService.createMessage(data.userId, sessionId, data.query, 'user');

    const masResponse = await this.masService.processQuery({
      query: data.query,
      queryId: userMessage.id,
      sessionId,
    });

    const assistantMessage = await this.authService.createMessage(
      data.userId,
      sessionId,
      masResponse.summary,
      'assistant',
    );

    // A sala do WebSocket usa o id da resposta do assistente, que também serve de searchId para o feedback
    this.eventsGateway.notifyQueryCompleted(assistantMessage.id, {
      summary: masResponse.summary,
    });

    return {
      searchId: assistantMessage.id,
      sessionId,
      summary: masResponse.summary,
      status: 'completed',
      createdAt: assistantMessage.createdAt,
    };
  }

  findAll(userId: string, sessionId?: string) {
    if (!sessionId) {
      return [];
    }
    return this.authService.findMessagesBySession(userId, sessionId);
  }
}
