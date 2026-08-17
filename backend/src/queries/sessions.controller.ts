import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MockService } from '../database/mock.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateSessionSchema } from 'shared';
import { Request } from 'express';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private mockService: MockService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.mockService.findAllSessions(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const session = this.mockService.findSessionById(id);
    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }
    return session;
  }

  @Post()
  create(@Req() req: Request, @Body(new ZodValidationPipe(CreateSessionSchema)) body: { title: string }) {
    const user = req.user as { id: string };
    return this.mockService.createSession({
      title: body.title,
      userId: user.id,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string }) {
    const session = this.mockService.updateSession(id, body);
    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }
    return session;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.mockService.deleteSession(id);
    if (!deleted) {
      throw new NotFoundException('Sessão não encontrada');
    }
    return { message: 'Sessão deletada com sucesso' };
  }
}
