import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join(', ');
      throw new BadRequestException(`Validação falhou: ${messages}`);
    }

    return result.data;
  }
}
