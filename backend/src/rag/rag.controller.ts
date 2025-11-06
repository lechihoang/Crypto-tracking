import { Controller, Get, Post, Query, Body } from "@nestjs/common";
import { RagService } from "./rag.service";
import { VectorService, SearchResult, IndexStats } from "./vector.service";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";
import { RagSchedulerService } from "./rag-scheduler.service";

@Controller("rag")
export class RagController {
  constructor(
    private ragService: RagService,
    private vectorService: VectorService,
    private embeddingService: EmbeddingService,
    private scraperService: ScraperService,
    private ragSchedulerService: RagSchedulerService,
  ) {}

  @Get("test/embedding")
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
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Embedding service failed",
      };
    }
  }

  @Get("test/pinecone")
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
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Pinecone connection failed",
      };
    }
  }

  @Get("test/coingecko")
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
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "CoinGecko API failed",
      };
    }
  }

  @Post("seed")
  async seedData() {
    try {
      console.log("Starting data seeding with CoinGecko API...");

      // Step 1: Initialize index
      await this.vectorService.initializeIndex();

      // Step 2: Fetch from CoinGecko API
      console.log(`Fetching CoinGecko data...`);
      const content = await this.scraperService.getAllCoinGeckoData();

      if (content.length === 0) {
        return {
          success: false,
          message: "No content was fetched from CoinGecko",
        };
      }

      // Step 3: Add to Pinecone
      console.log(`Adding ${content.length} items to Pinecone...`);
      await this.ragService.addMultipleDocuments(content);

      // Step 4: Get stats
      const stats = await this.vectorService.getIndexStats();

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
      console.error("Seed error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Seeding failed",
      };
    }
  }

  @Post("search")
  async search(
    @Body() body: { query: string; limit?: number; threshold?: number },
  ): Promise<{ success: boolean; results: SearchResult[]; count: number }> {
    try {
      const results = await this.ragService.searchSimilarDocuments(
        body.query,
        body.limit || 5,
        body.threshold || 0.3,
      );

      return {
        success: true,
        results,
        count: results.length,
      };
    } catch {
      return {
        success: false,
        results: [],
        count: 0,
      };
    }
  }

  @Get("stats")
  async getStats() {
    try {
      const stats = await this.vectorService.getIndexStats();

      return {
        success: true,
        stats,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Post("refresh")
  async refreshData() {
    try {
      await this.ragService.refreshCryptoData();

      const stats = await this.vectorService.getIndexStats();

      return {
        success: true,
        message: "Data refreshed successfully",
        stats,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Refresh failed",
      };
    }
  }

  @Post("clear")
  async clearAllData() {
    try {
      await this.vectorService.deleteAllVectors();

      const stats = await this.vectorService.getIndexStats();

      return {
        success: true,
        message: "All data cleared successfully",
        stats,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Failed to clear data",
      };
    }
  }

  /**
   * Trigger manual refresh via scheduler
   * This uses the scheduler service which has anti-concurrent protection
   */
  @Post("refresh/manual")
  async triggerManualRefresh() {
    return await this.ragSchedulerService.triggerManualRefresh();
  }

  /**
   * Get current refresh status
   */
  @Get("refresh/status")
  getRefreshStatus() {
    return this.ragSchedulerService.getRefreshStatus();
  }
}
