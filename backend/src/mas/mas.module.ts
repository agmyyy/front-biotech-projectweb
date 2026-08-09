import { Module } from '@nestjs/common';
import { MasService } from './mas.service';

@Module({
  providers: [MasService],
  exports: [MasService],
})
export class MasModule {}
