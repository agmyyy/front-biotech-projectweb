import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class FeedbackService {
  constructor(private authService: AuthService) {}

  // searchId é o id da mensagem do assistente avaliada
  create(data: { rating: number; searchId: string; userId: string }) {
    return this.authService.createRating(data.userId, data.rating, data.searchId);
  }
}
