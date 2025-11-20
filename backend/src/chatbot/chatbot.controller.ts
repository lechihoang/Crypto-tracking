import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ChatbotService } from "./chatbot.service";
import { SendMessageDto, ChatResponse } from "./dto/chat-message.dto";

@Controller("chatbot")
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post("chat")
  async sendMessage(
    @Body() body: SendMessageDto & { userId?: string },
  ): Promise<ChatResponse> {
    const userId = body.userId;

    const result = await this.chatbotService.sendMessage(
      body.message,
      body.sessionId,
      userId,
    );

    return {
      message: result.message,
      sessionId: result.sessionId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("history")
  async getChatHistory(
    @Query("userId") userId: string,
    @Query("sessionId") sessionId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException("User ID is required");
    }

    const messages = await this.chatbotService.getChatHistory(
      userId,
      sessionId,
    );

    const currentSessionId = messages.length > 0 ? messages[0].sessionId : null;

    return {
      sessionId: currentSessionId,
      messages: messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          id: (msg as any)._id.toString(),
          content: msg.content,
          role: msg.role,
          timestamp: (msg as any).createdAt,
        })),
    };
  }

  @Delete("history")
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearChatHistory(
    @Query("userId") userId: string,
    @Query("sessionId") sessionId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException("User ID is required");
    }

    await this.chatbotService.clearChatHistory(userId, sessionId);
  }
}
