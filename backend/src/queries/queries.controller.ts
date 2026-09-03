import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queriesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queriesService.remove(id);
  }

  @Post(':id/clarify')
  addClarification(
    @Param('id') id: string,
    @Body() body: { clarification: string },
  ) {
    return this.queriesService.addClarification(id, body.clarification);
  }
}
