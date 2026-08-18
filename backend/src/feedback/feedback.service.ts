import { Injectable, NotFoundException } from '@nestjs/common';
import { MockService } from '../database/mock.service';

@Injectable()
export class FeedbackService {
  constructor(private mockService: MockService) {}

  create(data: { rating: number; searchId: string; userId: string }) {
    const session = this.mockService.findSessionById(data.searchId);
    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    const existing = this.mockService.findFeedbackBySearchId(data.searchId).find((f) => f.userId === data.userId);
    if (existing) {
      return existing;
    }

    return this.mockService.createFeedback({
      rating: data.rating,
      searchId: data.searchId,
      userId: data.userId,
    });
  }

  findBySearchId(searchId: string) {
    return this.mockService.findFeedbackBySearchId(searchId);
  }
}
