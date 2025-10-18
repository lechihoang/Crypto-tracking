import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { RagService } from "../rag/rag.service";
import { ChatMessage } from "../entities";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class ChatbotService {
  private readonly groqApiKey: string;
  private readonly groqBaseUrl =
    "https://api.groq.com/openai/v1/chat/completions";

  // Simple in-memory session storage (in production, use Redis or database)
  private sessions = new Map<string, GroqMessage[]>();

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private configService: ConfigService,
    private ragService: RagService,
  ) {
    this.groqApiKey = this.configService.get<string>("GROQ_API_KEY") || "";
  }

  async sendMessage(
    message: string,
    sessionId?: string,
    userId?: string,
  ): Promise<{ message: string; sessionId: string }> {
    try {
      console.log(
        `[ChatBot] sendMessage called: userId=${userId}, sessionId=${sessionId}`,
      );

      // Generate session ID if not provided
      if (!sessionId) {
        sessionId = randomUUID();
      }

      // Get conversation history from database or memory
      let conversation: GroqMessage[];
      if (userId) {
        console.log(`[ChatBot] Loading conversation from DB for user ${userId}`);
        // For logged-in users, load from database
        conversation = await this.loadConversationFromDB(sessionId, userId);
      } else {
        console.log(`[ChatBot] Using in-memory storage for guest`);
        // For guests, use in-memory storage
        conversation = this.sessions.get(sessionId) || [];
      }

      // Add system prompt for first message
      if (conversation.length === 0) {
        const ragContext = await this.ragService.getRelevantContext(
          message,
          1500,
        );

        const systemMessage: GroqMessage = {
          role: "system",
          content: `You are a helpful cryptocurrency expert assistant with access to real-time crypto knowledge. You have deep knowledge about:
- Cryptocurrency fundamentals, trading, and market analysis
- Bitcoin, Ethereum, and other major cryptocurrencies
- DeFi, NFTs, blockchain technology
- Market trends and price analysis
- Risk management and investment strategies

${ragContext}

IMPORTANT: You MUST ONLY answer questions related to cryptocurrency, blockchain, and crypto trading. If a user asks about topics unrelated to crypto (such as cooking, sports, general knowledge, etc.), you must politely decline by responding: "Xin lỗi, tôi không thể trả lời câu hỏi này do nó không liên quan tới crypto. Tôi chỉ có thể giúp bạn với các câu hỏi về tiền điện tử, blockchain và thị trường crypto."

Please provide helpful, accurate, and up-to-date information about crypto topics. Keep responses concise and informative. When discussing prices or investments, always remind users to do their own research and never provide financial advice.

Current context: You're integrated into a crypto tracking web application where users can monitor their portfolio and cryptocurrency prices.`,
        };

        conversation.push(systemMessage);

        // Save system message to database for logged-in users
        if (userId) {
          await this.saveMessageToDB(
            sessionId,
            userId,
            systemMessage.role,
            systemMessage.content,
          );
        }
      }

      // Add user message
      conversation.push({
        role: "user",
        content: message,
      });

      // Save user message to database
      if (userId) {
        await this.saveMessageToDB(sessionId, userId, "user", message);
      }

      // Call Groq API
      const response = await axios.post<GroqResponse>(
        this.groqBaseUrl,
        {
          model: "llama-3.3-70b-versatile",
          messages: conversation,
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const assistantMessage = response.data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error("No response from AI service");
      }

      // Add assistant response to conversation
      conversation.push({
        role: "assistant",
        content: assistantMessage,
      });

      // Save assistant message to database
      if (userId) {
        await this.saveMessageToDB(
          sessionId,
          userId,
          "assistant",
          assistantMessage,
        );
      } else {
        // For guests, store in memory
        // Keep last 20 messages to manage memory
        if (conversation.length > 21) {
          // 1 system + 20 messages
          conversation = [conversation[0], ...conversation.slice(-20)];
        }
        this.sessions.set(sessionId, conversation);
      }

      return {
        message: assistantMessage,
        sessionId,
      };
    } catch (error) {
      console.error("Chatbot service error:", error);

      if (error.response?.status === 401) {
        throw new HttpException(
          "AI service authentication failed",
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (error.response?.status === 429) {
        throw new HttpException(
          "AI service rate limit exceeded. Please try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        "Failed to process message. Please try again.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async saveMessageToDB(
    sessionId: string,
    userId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ): Promise<void> {
    try {
      const message = this.chatMessageRepository.create({
        sessionId,
        userId,
        role,
        content,
      });
      await this.chatMessageRepository.save(message);
      console.log(
        `[ChatBot] Saved message: role=${role}, userId=${userId}, sessionId=${sessionId}`,
      );
    } catch (error) {
      console.error("[ChatBot] Error saving message to DB:", error);
      throw error;
    }
  }

  private async loadConversationFromDB(
    sessionId: string,
    userId: string,
  ): Promise<GroqMessage[]> {
    const messages = await this.chatMessageRepository.find({
      where: { sessionId, userId },
      order: { createdAt: "ASC" },
    });

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async getChatHistory(
    userId: string,
    sessionId?: string,
  ): Promise<ChatMessage[]> {
    try {
      console.log(
        `[ChatBot] Getting chat history for userId=${userId}, sessionId=${sessionId}`,
      );

      if (sessionId) {
        const messages = await this.chatMessageRepository.find({
          where: { userId, sessionId },
          order: { createdAt: "ASC" },
        });
        console.log(
          `[ChatBot] Found ${messages.length} messages for specific session`,
        );
        return messages;
      }

      // Get latest session for user
      const latestMessage = await this.chatMessageRepository.findOne({
        where: { userId },
        order: { createdAt: "DESC" },
      });

      if (!latestMessage) {
        console.log(`[ChatBot] No messages found for user`);
        return [];
      }

      console.log(
        `[ChatBot] Found latest session: ${latestMessage.sessionId}`,
      );

      const messages = await this.chatMessageRepository.find({
        where: { userId, sessionId: latestMessage.sessionId },
        order: { createdAt: "ASC" },
      });

      console.log(`[ChatBot] Returning ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error("[ChatBot] Error getting chat history:", error);
      return [];
    }
  }

  async clearChatHistory(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      // Clear specific session
      await this.chatMessageRepository.delete({ userId, sessionId });
    } else {
      // Clear all sessions for user
      await this.chatMessageRepository.delete({ userId });
    }
  }

  // Clear old sessions periodically (simple cleanup)
  clearOldSessions(): void {
    // Clear sessions older than 1 hour
    // In production, implement proper session management
    if (this.sessions.size > 100) {
      this.sessions.clear();
    }
  }
}
