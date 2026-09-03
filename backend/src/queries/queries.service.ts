import { Injectable, NotFoundException } from '@nestjs/common';
import { MockService } from '../database/mock.service';
import { MasService } from '../mas/mas.service';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QueriesService {
  constructor(
    private mockService: MockService,
    private masService: MasService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(data: { query: string; userId: string; sessionId?: string }) {
    let sessionId = data.sessionId;

    if (!sessionId) {
      const session = this.mockService.createSession({
        title: data.query.slice(0, 50),
        userId: data.userId,
      });
      sessionId = session.id;
    }

    const query = this.mockService.createQuery({
      query: data.query,
      sessionId,
      userId: data.userId,
    });

    const masResponse = await this.masService.processQuery({
      query: data.query,
      queryId: query.id,
      sessionId,
    });

    query.summary = masResponse.summary;
    query.suggestions = masResponse.suggestions;
    query.justifications = masResponse.justifications;
    query.sources = masResponse.sources;
    query.status = 'completed';

    this.eventsGateway.notifyQueryCompleted(query.id, {
      summary: query.summary,
      suggestions: query.suggestions,
      justifications: query.justifications,
      sources: query.sources,
    });

    return {
      id: query.id,
      query: query.query,
      sessionId: query.sessionId,
      summary: query.summary,
      suggestions: query.suggestions,
      justifications: query.justifications,
      sources: query.sources,
      clarifications: query.clarifications,
      status: query.status,
      createdAt: query.createdAt,
    };
  }

  findAll(userId: string, sessionId?: string) {
    return this.mockService.findAllQueries(userId, sessionId).map((q) => ({
      id: q.id,
      query: q.query,
      sessionId: q.sessionId,
      summary: q.summary,
      suggestions: q.suggestions,
      justifications: q.justifications,
      sources: q.sources,
      clarifications: q.clarifications,
      status: q.status,
      createdAt: q.createdAt,
    }));
  }

  findOne(id: string) {
    const query = this.mockService.findQueryById(id);
    if (!query) {
      throw new NotFoundException('Consulta não encontrada');
    }
    return {
      id: query.id,
      query: query.query,
      sessionId: query.sessionId,
      summary: query.summary,
      suggestions: query.suggestions,
      justifications: query.justifications,
      sources: query.sources,
      clarifications: query.clarifications,
      status: query.status,
      createdAt: query.createdAt,
    };
  }

  async remove(id: string) {
    const deleted = this.mockService.deleteQuery(id);
    if (!deleted) {
      throw new NotFoundException('Consulta não encontrada');
    }
    return { message: 'Consulta deletada com sucesso' };
  }

  async addClarification(queryId: string, clarification: string) {
    const query = this.mockService.addClarification(queryId, clarification);
    if (!query) {
      throw new NotFoundException('Consulta não encontrada');
    }

    this.eventsGateway.notifyClarification(queryId, clarification);

    return {
      id: query.id,
      clarifications: query.clarifications,
    };
  }
}
