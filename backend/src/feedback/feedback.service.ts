import { Injectable, NotFoundException } from '@nestjs/common';
import { MockService } from '../database/mock.service';

@Injectable()
export class FeedbackService {
  constructor(private mockService: MockService) {}

  create(data: { rating: number; searchId: string; userId: string }) {
    const query = this.mockService.findQueryById(data.searchId);
    if (!query) {
      throw new NotFoundException('Consulta não encontrada');
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
