import { Controller, Get, Post, Query, Body } from "@nestjs/common";
import { RagService } from "./rag.service";
import { VectorService, SearchResult } from "./vector.service";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";

@Controller("rag")
export class RagController {
  constructor(
    private ragService: RagService,
    private vectorService: VectorService,
    private embeddingService: EmbeddingService,
    private scraperService: ScraperService,
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Embedding service failed",
      };
    }
  }

  @Get("test/pinecone")
  async testPinecone() {
    try {
      const stats = await this.vectorService.getIndexStats();

      return {
        success: true,
        stats,
        message: "Pinecone connection is working",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Pinecone connection failed",
      };
    }
  }

  @Get("test/coingecko")
  async testCoinGecko(@Query("limit") limit?: string) {
    try {
      const content = await this.scraperService.getAllCoinGeckoData(
        limit ? parseInt(limit) : 10,
      );

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
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "CoinGecko API failed",
      };
    }
  }

  @Post("seed")
  async seedData(@Body() body: { coinsLimit?: number }) {
    try {
      console.log("Starting data seeding with CoinGecko API...");

      // Step 1: Initialize index
      await this.vectorService.initializeIndex();

      // Step 2: Fetch from CoinGecko API
      const coinsLimit = body.coinsLimit || 100;
      console.log(`Fetching CoinGecko data (${coinsLimit} coins)...`);
      const content = await this.scraperService.getAllCoinGeckoData(coinsLimit);

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
    } catch (error) {
      console.error("Seed error:", error);
      return {
        success: false,
        error: error.message,
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
    } catch (error) {
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
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
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to clear data",
      };
    }
  }
}
