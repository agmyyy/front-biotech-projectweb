import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      const messages = exception.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      response.status(400).json({
        error: 'Dados inválidos',
        details: messages,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      response.status(status).json(
        typeof res === 'string'
          ? { error: res }
          : res,
      );
      return;
    }

    console.error('Unhandled exception:', exception);
    response.status(500).json({ error: 'Erro interno do servidor' });
  }
}
