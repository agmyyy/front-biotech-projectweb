import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { QueriesService } from './queries.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SearchSchema } from 'shared';
import { Request } from 'express';

@Controller('queries')
@UseGuards(JwtAuthGuard)
export class QueriesController {
  constructor(private queriesService: QueriesService) {}

  @Post()
  create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(SearchSchema)) body: { query: string; sessionId?: string },
  ) {
    const user = req.user as { id: string };
    return this.queriesService.create({
      query: body.query,
      userId: user.id,
      sessionId: body.sessionId,
    });
  }

  @Get()
  findAll(@Req() req: Request, @Query('sessionId') sessionId?: string) {
    const user = req.user as { id: string };
    return this.queriesService.findAll(user.id, sessionId);
  }
}
