import { Module } from '@nestjs/common';
import { QueriesController } from './queries.controller';
import { SessionsController } from './sessions.controller';
import { QueriesService } from './queries.service';
import { MasModule } from '../mas/mas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MasModule, AuthModule],
  controllers: [QueriesController, SessionsController],
  providers: [QueriesService],
})
export class QueriesModule {}
