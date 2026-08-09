import { Module } from '@nestjs/common';
import { QueriesController } from './queries.controller';
import { SessionsController } from './sessions.controller';
import { QueriesService } from './queries.service';
import { MasModule } from '../mas/mas.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MasModule, EventsModule],
  controllers: [QueriesController, SessionsController],
  providers: [QueriesService],
})
export class QueriesModule {}
