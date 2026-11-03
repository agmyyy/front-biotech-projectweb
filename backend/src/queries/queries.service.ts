import { Injectable, NotImplementedException } from '@nestjs/common';
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
      suggestions: masResponse.suggestions,
      justifications: masResponse.justifications,
      sources: masResponse.sources,
    });

    return {
      searchId: assistantMessage.id,
      sessionId,
      summary: masResponse.summary,
      suggestions: masResponse.suggestions,
      justifications: masResponse.justifications,
      sources: masResponse.sources,
      clarifications: masResponse.clarifications ?? [],
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

  findOne(userId: string, messageId: string) {
    return this.authService.findOwnedMessage(userId, messageId);
  }

  async remove(userId: string, messageId: string) {
    await this.authService.deleteMessage(userId, messageId);
    return { message: 'Consulta deletada com sucesso' };
  }

  // Não implementado: o schema ainda não guarda esclarecimentos
  addClarification() {
    throw new NotImplementedException('Esclarecimentos ainda não são armazenados');
  }
}
