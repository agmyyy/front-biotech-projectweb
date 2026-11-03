import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  BadRequestException,
  NotImplementedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateSessionSchema } from 'shared';
import { Request } from 'express';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private authService: AuthService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.findSessionsByUser(user.id);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.authService.findSessionById(user.id, id);
  }

  @Post()
  create(@Req() req: Request, @Body(new ZodValidationPipe(CreateSessionSchema)) body: { title: string }) {
    const user = req.user as { id: string };
    return this.authService.createSession(user.id, body.title);
  }

  // Só altera o título: as mensagens são criadas pelo fluxo de /queries
  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() body: { title?: string }) {
    const user = req.user as { id: string };
    if (!body.title) {
      throw new BadRequestException('O título é obrigatório');
    }
    return this.authService.updateSessionTitle(user.id, id, body.title);
  }

  // Não implementado: o frontend envia o histórico inteiro, o que duplicaria mensagens no banco
  @Post(':id/messages')
  appendMessages() {
    throw new NotImplementedException('Use POST /queries para criar mensagens');
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    await this.authService.deleteSession(user.id, id);
    return { message: 'Sessão deletada com sucesso' };
  }
}
