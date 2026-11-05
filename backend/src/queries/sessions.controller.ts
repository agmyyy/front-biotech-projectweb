import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateSessionSchema, UpdateSessionSchema } from 'shared';
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
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSessionSchema)) body: { title: string },
  ) {
    const user = req.user as { id: string };
    return this.authService.updateSessionTitle(user.id, id, body.title);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    await this.authService.deleteSession(user.id, id);
    return { message: 'Sessão deletada com sucesso' };
  }
}
