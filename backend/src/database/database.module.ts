import { Module, Global } from '@nestjs/common';
import { MockService } from './mock.service';

@Global()
@Module({
  providers: [MockService],
  exports: [MockService],
})
export class DatabaseModule {}
