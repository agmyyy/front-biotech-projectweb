import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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
