import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FeedbackSchema } from 'shared';
import { Request } from 'express';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  create(@Req() req: Request, @Body(new ZodValidationPipe(FeedbackSchema)) body: { rating: number; searchId: string }) {
    const user = req.user as { id: string };
    return this.feedbackService.create({
      rating: body.rating,
      searchId: body.searchId,
      userId: user.id,
    });
  }

  @Get(':searchId')
  findBySearchId(@Param('searchId') searchId: string) {
    return this.feedbackService.findBySearchId(searchId);
  }
}
