import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { QueriesModule } from "./queries/queries.module";
import { MasModule } from "./mas/mas.module";
import { FeedbackModule } from "./feedback/feedback.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limit global de 100 requisições por minuto por IP; as rotas sensíveis
    // (login/register) sobrescrevem com limite mais apertado via @Throttle
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    AuthModule,
    QueriesModule,
    MasModule,
    FeedbackModule,
  ],
  providers: [
    // Guard global: aplica o rate limit em todas as rotas sem precisar marcá-las uma a uma
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
