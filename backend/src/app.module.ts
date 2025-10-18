import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { CryptoModule } from "./crypto/crypto.module";
import { AlertsModule } from "./alerts/alerts.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { ChatbotModule } from "./chatbot/chatbot.module";
import { RagModule } from "./rag/rag.module";
import {
  PriceAlert,
  PortfolioHolding,
  PortfolioSnapshot,
  ChatMessage,
  PortfolioBenchmark,
} from "./entities";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [
        PriceAlert,
        PortfolioHolding,
        PortfolioSnapshot,
        ChatMessage,
        PortfolioBenchmark,
      ],
      synchronize: true, // Auto-create tables in development
      ssl: { rejectUnauthorized: false },
      logging: false,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CryptoModule,
    AlertsModule,
    PortfolioModule,
    ChatbotModule,
    RagModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
