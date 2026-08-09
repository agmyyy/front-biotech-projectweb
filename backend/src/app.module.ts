import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { QueriesModule } from './queries/queries.module';
import { MasModule } from './mas/mas.module';
import { FeedbackModule } from './feedback/feedback.module';
import { EventsModule } from './events/events.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    QueriesModule,
    MasModule,
    FeedbackModule,
    EventsModule,
  ],
})
export class AppModule {}
