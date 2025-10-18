import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatbotController } from "./chatbot.controller";
import { ChatbotService } from "./chatbot.service";
import { RagModule } from "../rag/rag.module";
import { ChatMessage } from "../entities";

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage]), RagModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
