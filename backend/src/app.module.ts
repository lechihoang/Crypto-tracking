import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { CryptoModule } from "./crypto/crypto.module";
import { AlertsModule } from "./alerts/alerts.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { ChatbotModule } from "./chatbot/chatbot.module";
import { RagModule } from "./rag/rag.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/crypto-tracking",
    ),
    ScheduleModule.forRoot(),
    AuthModule,
    CryptoModule,
    AlertsModule,
    PortfolioModule,
    ChatbotModule,
    RagModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
