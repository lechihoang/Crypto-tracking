import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { randomUUID } from "crypto";
import { RagService } from "../rag/rag.service";
import { ChatMessage } from "../schemas/chat-message.schema";
import { CHATBOT_SYSTEM_PROMPT_TEMPLATE } from "./chatbot.constants";

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
  private readonly logger = new Logger(ChatbotService.name);
  private readonly groqApiKey: string;
  private readonly groqBaseUrl =
    "https://api.groq.com/openai/v1/chat/completions";

  // Simple in-memory session storage (in production, use Redis or database)
  private sessions = new Map<string, GroqMessage[]>();
  // Track last access time for each session to enable cleanup
  private sessionLastAccess = new Map<string, number>();

  constructor(
    @InjectModel(ChatMessage.name)
    private chatMessageModel: Model<ChatMessage>,
    private configService: ConfigService,
    private ragService: RagService,
  ) {
    this.groqApiKey = this.configService.get<string>("GROQ_API_KEY") || "";

    if (!this.groqApiKey) {
      this.logger.error("GROQ_API_KEY is not configured");
      throw new Error("GROQ_API_KEY environment variable is required");
    }
  }


  /**
   * Send a message to the chatbot and get a response
   * Handles conversation history, RAG context retrieval, and Groq API calls
   * @param message - The user's message
   * @param sessionId - Optional session ID for conversation continuity
   * @param userId - Optional user ID for logged-in users (enables DB persistence)
   * @returns Object containing the assistant's response message and session ID
   * @throws HttpException if message processing fails
   */
  async sendMessage(
    message: string,
    sessionId?: string,
    userId?: string,
  ): Promise<{ message: string; sessionId: string }> {
    try {
      this.logger.log(
        `sendMessage called: userId=${userId}, sessionId=${sessionId}`,
      );

      const finalSessionId = sessionId || randomUUID();
      const conversation = await this.getOrCreateConversation(
        finalSessionId,
        userId,
        message,
      );

      await this.addUserMessage(conversation, finalSessionId, userId, message);
      const assistantMessage = await this.callGroqAPI(conversation);
      await this.addAssistantMessage(
        conversation,
        finalSessionId,
        userId,
        assistantMessage,
      );

      return {
        message: assistantMessage,
        sessionId: finalSessionId,
      };
    } catch (error: unknown) {
      this.handleSendMessageError(error);
    }
  }

  /**
   * Get chat history for a user
   * @param userId - The user ID to fetch history for
   * @param sessionId - Optional specific session ID, otherwise returns latest session
   * @returns Array of chat messages in chronological order
   * @throws HttpException if history retrieval fails
   */
  async getChatHistory(
    userId: string,
    sessionId?: string,
  ): Promise<ChatMessage[]> {
    try {
      this.logger.log(
        `Getting chat history for userId=${userId}, sessionId=${sessionId}`,
      );

      if (sessionId) {
        const messages = await this.chatMessageModel
          .find({ userId, sessionId })
          .sort({ createdAt: 1 })
          .exec();
        this.logger.log(
          `Found ${messages.length} messages for specific session`,
        );
        return messages;
      }

      // Get latest session for user
      const latestMessage = await this.chatMessageModel
        .findOne({ userId })
        .sort({ createdAt: -1 })
        .exec();

      if (!latestMessage) {
        this.logger.log(`No messages found for user ${userId}`);
        return [];
      }

      this.logger.log(`Found latest session: ${latestMessage.sessionId}`);

      const messages = await this.chatMessageModel
        .find({ userId, sessionId: latestMessage.sessionId })
        .sort({ createdAt: 1 })
        .exec();

      this.logger.log(`Returning ${messages.length} messages`);
      return messages;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to retrieve chat history: userId=${userId}, sessionId=${sessionId}, error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        "Failed to retrieve chat history from database",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async clearChatHistory(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        // Clear specific session
        const result = await this.chatMessageModel
          .deleteMany({ userId, sessionId })
          .exec();
        this.logger.log(
          `Cleared ${result.deletedCount} messages for session ${sessionId}`,
        );
      } else {
        // Clear all sessions for user
        const result = await this.chatMessageModel
          .deleteMany({ userId })
          .exec();
        this.logger.log(
          `Cleared ${result.deletedCount} messages for user ${userId}`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Failed to clear chat history: userId=${userId}, sessionId=${sessionId}, error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        "Failed to clear chat history from database",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Clear old in-memory sessions for guest users that haven't been accessed recently
   * This prevents memory leaks from abandoned guest sessions
   * Called periodically by scheduler (every 24 hours)
   * Sessions older than 24 hours are removed from memory
   */
  clearOldSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let clearedCount = 0;

    for (const [sessionId, lastAccess] of this.sessionLastAccess.entries()) {
      if (now - lastAccess > maxAge) {
        this.sessions.delete(sessionId);
        this.sessionLastAccess.delete(sessionId);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      this.logger.log(
        `Cleared ${clearedCount} old guest sessions (older than 24 hours)`,
      );
    }
  }


  /**
   * Get or create conversation with system prompt if needed
   */
  private async getOrCreateConversation(
    sessionId: string,
    userId: string | undefined,
    message: string,
  ): Promise<GroqMessage[]> {
    let conversation: GroqMessage[];

    if (userId) {
      this.logger.log(`Loading conversation from DB for user ${userId}`);
      conversation = await this.loadConversationFromDB(sessionId, userId);
    } else {
      this.logger.log(`Using in-memory storage for guest`);
      conversation = this.sessions.get(sessionId) || [];
      // Update last access time for guest sessions
      if (conversation.length > 0) {
        this.sessionLastAccess.set(sessionId, Date.now());
      }
    }

    if (conversation.length === 0) {
      const systemMessage = await this.buildSystemPrompt(message);
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

    return conversation;
  }

  /**
   * Build system prompt with RAG context
   */
  private async buildSystemPrompt(message: string): Promise<GroqMessage> {
    try {
      const ragContext = await this.ragService.getRelevantContext(
        message,
        1500,
      );

      this.logger.log(
        `Successfully retrieved RAG context (${ragContext.length} chars) for message`,
      );

      return {
        role: "system",
        content: CHATBOT_SYSTEM_PROMPT_TEMPLATE(ragContext),
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to get RAG context, using default prompt. Error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Fallback to prompt without RAG context
      return {
        role: "system",
        content: CHATBOT_SYSTEM_PROMPT_TEMPLATE(""),
      };
    }
  }

  /**
   * Call Groq API to get assistant response
   */
  private async callGroqAPI(conversation: GroqMessage[]): Promise<string> {
    try {
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
          timeout: 30000, // 30 second timeout
        },
      );

      const assistantMessage = response.data.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new HttpException(
          "No response from AI service",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return assistantMessage;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new HttpException(
            "AI service request timed out. Please try again.",
            HttpStatus.REQUEST_TIMEOUT,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Add user message to conversation and save to database if needed
   */
  private async addUserMessage(
    conversation: GroqMessage[],
    sessionId: string,
    userId: string | undefined,
    message: string,
  ): Promise<void> {
    conversation.push({
      role: "user",
      content: message,
    });

    if (userId) {
      await this.saveMessageToDB(sessionId, userId, "user", message);
    }
  }

  /**
   * Add assistant message to conversation and save
   */
  private async addAssistantMessage(
    conversation: GroqMessage[],
    sessionId: string,
    userId: string | undefined,
    assistantMessage: string,
  ): Promise<void> {
    conversation.push({
      role: "assistant",
      content: assistantMessage,
    });

    await this.saveConversation(
      sessionId,
      userId,
      conversation,
      assistantMessage,
    );
  }

  /**
   * Save conversation to database or memory
   */
  private async saveConversation(
    sessionId: string,
    userId: string | undefined,
    conversation: GroqMessage[],
    assistantMessage: string,
  ): Promise<void> {
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
      // Update last access time
      this.sessionLastAccess.set(sessionId, Date.now());
    }
  }

  /**
   * Handle errors from sendMessage and throw appropriate HTTP exceptions
   */
  private handleSendMessageError(error: unknown): never {
    // Log detailed error information
    if (axios.isAxiosError(error)) {
      this.logger.error(
        `Groq API error: status=${error.response?.status}, message=${error.message}, data=${JSON.stringify(error.response?.data)}`,
        error.stack,
      );

      if (error.response?.status === 401) {
        throw new HttpException(
          "AI service authentication failed. Please check API configuration.",
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (error.response?.status === 429) {
        throw new HttpException(
          "AI service rate limit exceeded. Please try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error.response?.status === 503 || error.response?.status === 502) {
        throw new HttpException(
          "AI service is temporarily unavailable. Please try again later.",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.response?.status === 400) {
        throw new HttpException(
          "Invalid request to AI service. Please try rephrasing your message.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generic Groq API error
      throw new HttpException(
        `AI service error: ${error.response?.statusText || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Handle HttpException from internal methods
    if (error instanceof HttpException) {
      throw error;
    }

    // Log unexpected errors with full context
    this.logger.error(
      `Unexpected error in chatbot service: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );

    throw new HttpException(
      "Failed to process message. Please try again.",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private async saveMessageToDB(
    sessionId: string,
    userId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ): Promise<void> {
    try {
      const message = new this.chatMessageModel({
        sessionId,
        userId,
        role,
        content,
      });
      await message.save();
      this.logger.log(
        `Saved message: role=${role}, userId=${userId}, sessionId=${sessionId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to save message to database: role=${role}, userId=${userId}, sessionId=${sessionId}, error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        "Failed to save chat message to database",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async loadConversationFromDB(
    sessionId: string,
    userId: string,
  ): Promise<GroqMessage[]> {
    try {
      const messages = await this.chatMessageModel
        .find({ sessionId, userId })
        .sort({ createdAt: 1 })
        .exec();

      this.logger.log(
        `Loaded ${messages.length} messages from database for userId=${userId}, sessionId=${sessionId}`,
      );

      return messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    } catch (error: unknown) {
      this.logger.error(
        `Failed to load conversation from database: userId=${userId}, sessionId=${sessionId}, error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new HttpException(
        "Failed to load chat history from database",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
