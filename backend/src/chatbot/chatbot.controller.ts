import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UnauthorizedException,
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
    console.log("[ChatBot Controller] Received request body:", body);

    // Extract userId from request body (for logged-in users)
    const userId = body.userId;

    console.log(
      "[ChatBot Controller] Calling service with userId:",
      userId,
      "sessionId:",
      body.sessionId,
    );

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

    // Get sessionId from messages if exists
    const currentSessionId = messages.length > 0 ? messages[0].sessionId : null;

    return {
      sessionId: currentSessionId,
      messages: messages
        .filter((msg) => msg.role !== "system") // Filter out system messages
        .map((msg) => ({
          id: (msg as any)._id.toString(),
          content: msg.content,
          sender: msg.role === "user" ? "user" : "bot",
          timestamp: (msg as any).createdAt,
        })),
    };
  }

  @Delete("history")
  async clearChatHistory(
    @Query("userId") userId: string,
    @Query("sessionId") sessionId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException("User ID is required");
    }

    await this.chatbotService.clearChatHistory(userId, sessionId);

    return {
      message: "Chat history cleared successfully",
    };
  }
}
