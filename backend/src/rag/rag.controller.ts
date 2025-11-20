import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { RagService } from "./rag.service";
import { VectorService, SearchResult, IndexStats } from "./vector.service";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";
import { RagSchedulerService } from "./rag-scheduler.service";
import { DevelopmentOnlyGuard } from "../common/guards";

@Controller("rag")
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(
    private ragService: RagService,
    private vectorService: VectorService,
    private embeddingService: EmbeddingService,
    private scraperService: ScraperService,
  ) {}

  @Get("test/embedding")
  @UseGuards(DevelopmentOnlyGuard)
  async testEmbedding(@Query("text") text: string) {
    try {
      const testText = text || "Bitcoin is a decentralized cryptocurrency";

      const embedding = await this.embeddingService.createEmbedding(testText);

      return {
        success: true,
        text: testText,
        embeddingDimension: embedding.length,
        embeddingPreview: embedding.slice(0, 5),
        message: "Embedding service is working correctly",
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Embedding service test failed: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Embedding service failed",
          error: errorMessage,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get("test/pinecone")
  @UseGuards(DevelopmentOnlyGuard)
  async testPinecone(): Promise<{
    success: boolean;
    stats?: IndexStats | null;
    message: string;
    error?: string;
  }> {
    try {
      const stats: IndexStats | null = await this.vectorService.getIndexStats();

      return {
        success: true,
        stats,
        message: "Pinecone connection is working",
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Pinecone connection test failed: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Pinecone connection failed",
          error: errorMessage,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get("test/coingecko")
  @UseGuards(DevelopmentOnlyGuard)
  async testCoinGecko() {
    try {
      const content = await this.scraperService.getAllCoinGeckoData();

      return {
        success: true,
        itemsCount: content.length,
        items: content.map((item) => ({
          title: item.title,
          source: item.source,
          url: item.url,
          contentLength: item.content.length,
        })),
        message: "CoinGecko API is working correctly",
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `CoinGecko API test failed: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "CoinGecko API failed",
          error: errorMessage,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post("seed")
  async seedData() {
    try {
      this.logger.log("Starting data seeding with CoinGecko API...");

      // Step 1: Initialize index
      await this.vectorService.initializeIndex();

      // Step 2: Fetch from CoinGecko API
      this.logger.log(`Fetching CoinGecko data...`);
      const content = await this.scraperService.getAllCoinGeckoData();

      if (content.length === 0) {
        this.logger.warn(
          "No content fetched from CoinGecko API during seeding",
        );

        throw new HttpException(
          {
            success: false,
            message:
              "No content was fetched from CoinGecko API. The service may be unavailable.",
            error: "No data available",
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Step 3: Add to Pinecone
      this.logger.log(`Adding ${content.length} items to Pinecone...`);
      await this.ragService.addMultipleDocuments(content);

      // Step 4: Get stats
      const stats = await this.vectorService.getIndexStats();

      this.logger.log(
        `Successfully seeded ${content.length} items to knowledge base`,
      );

      return {
        success: true,
        itemsFetched: content.length,
        items: content.map((a) => ({
          title: a.title,
          source: a.source,
          url: a.url,
        })),
        pineconeStats: stats,
        message: `Successfully seeded ${content.length} items to Pinecone`,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // If it's already an HttpException, log and rethrow it
      if (error instanceof HttpException) {
        this.logger.error(`Seed operation failed: ${errorMessage}`, errorStack);
        throw error;
      }

      // For unexpected errors, log and return 500
      this.logger.error(
        `Unexpected error during seed operation: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Failed to seed knowledge base with data",
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("search")
  async search(
    @Body() body: { query: string; limit?: number; threshold?: number },
  ): Promise<{ success: boolean; results: SearchResult[]; count: number }> {
    try {
      // Validate query parameter
      if (!body.query || body.query.trim().length === 0) {
        this.logger.warn("Search request received with empty query");

        throw new HttpException(
          {
            success: false,
            message: "Query parameter is required and cannot be empty",
            error: "Validation failed",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate limit parameter
      if (body.limit !== undefined && (body.limit < 1 || body.limit > 50)) {
        this.logger.warn(
          `Search request received with invalid limit: ${body.limit}`,
        );

        throw new HttpException(
          {
            success: false,
            message: "Limit must be between 1 and 50",
            error: "Validation failed",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate threshold parameter
      if (
        body.threshold !== undefined &&
        (body.threshold < 0 || body.threshold > 1)
      ) {
        this.logger.warn(
          `Search request received with invalid threshold: ${body.threshold}`,
        );

        throw new HttpException(
          {
            success: false,
            message: "Threshold must be between 0 and 1",
            error: "Validation failed",
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const limit = body.limit || 5;
      const threshold = body.threshold || 0.3;

      const results = await this.ragService.searchSimilarDocuments(
        body.query,
        limit,
        threshold,
      );

      return {
        success: true,
        results,
        count: results.length,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // If it's already an HttpException, log and rethrow it
      if (error instanceof HttpException) {
        this.logger.error(
          `Search operation failed: ${errorMessage}`,
          errorStack,
        );
        throw error;
      }

      // For unexpected errors, log and return 500
      this.logger.error(
        `Unexpected error during search operation: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Failed to search knowledge base",
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("stats")
  async getStats() {
    try {
      const stats = await this.vectorService.getIndexStats();

      if (!stats) {
        this.logger.warn(
          "Unable to retrieve index statistics - stats returned null",
        );

        throw new HttpException(
          {
            success: false,
            message:
              "Unable to retrieve index statistics. The vector database may be unavailable.",
            error: "Stats unavailable",
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        success: true,
        stats,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // If it's already an HttpException, log and rethrow it
      if (error instanceof HttpException) {
        this.logger.error(
          `Failed to retrieve stats: ${errorMessage}`,
          errorStack,
        );
        throw error;
      }

      // For unexpected errors, log and return 503
      this.logger.error(
        `Unexpected error retrieving stats: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Failed to retrieve vector database statistics",
          error: errorMessage,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Post("refresh")
  async refreshData() {
    try {
      this.logger.log("Starting crypto data refresh...");

      await this.ragService.refreshCryptoData();

      const stats = await this.vectorService.getIndexStats();

      this.logger.log("Crypto data refresh completed successfully");

      return {
        success: true,
        message: "Crypto data refreshed successfully",
        stats,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // If it's already an HttpException, log and rethrow it
      if (error instanceof HttpException) {
        this.logger.error(
          `Crypto data refresh failed: ${errorMessage}`,
          errorStack,
        );
        throw error;
      }

      // For unexpected errors, log and return 500
      this.logger.error(
        `Unexpected error during crypto data refresh: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Failed to refresh crypto data from external sources",
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("clear")
  async clearAllData() {
    try {
      this.logger.log("Clearing all vectors from knowledge base...");

      await this.vectorService.deleteAllVectors();

      const stats = await this.vectorService.getIndexStats();

      this.logger.log("All vectors cleared successfully");

      return {
        success: true,
        message: "All vectors cleared from knowledge base successfully",
        stats,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // If it's already an HttpException, log and rethrow it
      if (error instanceof HttpException) {
        this.logger.error(
          `Failed to clear vectors: ${errorMessage}`,
          errorStack,
        );
        throw error;
      }

      // For unexpected errors, log and return 500
      this.logger.error(
        `Unexpected error clearing vectors: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        {
          success: false,
          message: "Failed to clear data from vector database",
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
