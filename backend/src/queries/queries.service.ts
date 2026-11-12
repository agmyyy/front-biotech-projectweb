import { Injectable, BadRequestException, BadGatewayException, HttpException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MasService } from '../mas/mas.service';

@Injectable()
export class QueriesService {
  constructor(
    private authService: AuthService,
    private masService: MasService,
  ) {}

  // Grava a pergunta e a resposta como mensagens da mesma sessão
  async create(data: { query: string; userId: string; sessionId?: string }) {
    const sessionId = data.sessionId ?? (await this.authService.createSession(data.userId)).id;

    const userMessage = await this.authService.createMessage(data.userId, sessionId, data.query, 'user');

    // A pergunta do usuário já está gravada; se o MAS ou a resposta falharem,
    // mantemos o histórico (o usuário digitou) e respondemos 502
    let masResponse;
    let assistantMessage;
    try {
      masResponse = await this.masService.processQuery({
        query: data.query,
        queryId: userMessage.id,
        sessionId,
      });

      assistantMessage = await this.authService.createMessage(
        data.userId,
        sessionId,
        masResponse.summary,
        'assistant',
      );
    } catch (error) {
      // Erros já mapeados (banco) mantêm o status original; falha vinda do MAS vira 502
      if (error instanceof HttpException) {
        console.error('Falha ao gravar a resposta do assistente:', error);
        throw error;
      }
      console.error('Falha ao processar a pergunta no MAS:', error);
      throw new BadGatewayException(
        'Não foi possível processar a pergunta no momento. Tente novamente.',
      );
    }

    return {
      // O id da resposta do assistente serve de searchId para a avaliação (feedback)
      searchId: assistantMessage.id,
      sessionId,
      summary: masResponse.summary,
      status: 'completed',
      createdAt: assistantMessage.createdAt,
    };
  }

  findAll(userId: string, sessionId?: string) {
    // Sem sessionId não há como filtrar as mensagens; devolver [] esconderia o uso incorreto da rota
    if (!sessionId) {
      throw new BadRequestException('O parâmetro sessionId é obrigatório');
    }
    return this.authService.findMessagesBySession(userId, sessionId);
  }
}
