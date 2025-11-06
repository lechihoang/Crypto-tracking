import { Injectable, OnModuleInit } from "@nestjs/common";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";
import { VectorService, SearchResult, IndexStats } from "./vector.service";
import { ScrapedContent } from "./dto";

@Injectable()
export class RagService implements OnModuleInit {
  constructor(
    private embeddingService: EmbeddingService,
    private scraperService: ScraperService,
    private vectorService: VectorService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Initialize Pinecone index only (no auto-seeding)
    await this.vectorService.initializeIndex();

    // Check stats
    const stats: IndexStats | null = await this.vectorService.getIndexStats();
    if (stats && stats.totalVectorCount > 0) {
      console.log(
        `Pinecone index ready with ${stats.totalVectorCount} vectors`,
      );
    } else {
      console.log(
        `Pinecone index ready (empty). Run 'npm run seed:rag' to add data.`,
      );
    }
  }

  async searchSimilarDocuments(
    query: string,
    limit: number = 5,
    threshold: number = 0.5,
  ): Promise<SearchResult[]> {
    try {
      // Create embedding for the query
      const queryEmbedding = await this.embeddingService.createEmbedding(query);

      // Search for similar documents in Pinecone
      const results = await this.vectorService.searchSimilar(
        queryEmbedding,
        limit,
      );

      // Filter by threshold (Pinecone uses cosine similarity, values 0-1)
      return results.filter((result) => result.score >= threshold);
    } catch (error: unknown) {
      console.error("Error searching similar documents:", error);
      return [];
    }
  }

  async addDocument(content: ScrapedContent): Promise<void> {
    try {
      // Split content into chunks if it's too long
      const chunks = this.chunkContent(content.content, 1000);

      const documents: Array<{
        id: string;
        embedding: number[];
        metadata: {
          content: string;
          title: string;
          url: string;
          source: string;
          publishedAt: Date;
        };
      }> = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Create embedding for the chunk
        const embedding = await this.embeddingService.createEmbedding(chunk);

        // Prepare document for Pinecone
        documents.push({
          id: `${content.source}-${Date.now()}-${i}`,
          embedding: embedding,
          metadata: {
            content: chunk,
            title: i === 0 ? content.title : `${content.title} (Part ${i + 1})`,
            url: content.url,
            source: content.source,
            publishedAt: content.publishedAt || new Date(),
          },
        });

        // Small delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Upsert all chunks to Pinecone
      await this.vectorService.upsertDocuments(documents);
    } catch (error: unknown) {
      console.error("Error adding document:", error);
    }
  }

  async addMultipleDocuments(contents: ScrapedContent[]): Promise<void> {
    // Deduplicate by URL
    const uniqueContents = Array.from(
      new Map(contents.map((item) => [item.url, item])).values(),
    );

    if (uniqueContents.length < contents.length) {
      console.log(
        `Removed ${contents.length - uniqueContents.length} duplicate articles`,
      );
    }

    console.log(
      `Processing ${uniqueContents.length} unique articles for embedding...`,
    );

    const allDocuments: Array<{
      id: string;
      embedding: number[];
      metadata: {
        content: string;
        title: string;
        url: string;
        source: string;
        publishedAt: Date;
      };
    }> = [];

    // Step 1: Create embeddings for ALL unique documents
    for (let i = 0; i < uniqueContents.length; i++) {
      const content = uniqueContents[i];
      try {
        console.log(
          `[${i + 1}/${uniqueContents.length}] Creating embeddings for: ${content.title.substring(0, 50)}...`,
        );

        // Split content into chunks
        const chunks = this.chunkContent(content.content, 1000);
        console.log(`  → Split into ${chunks.length} chunks`);

        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];

          // Create embedding for the chunk
          const embedding = await this.embeddingService.createEmbedding(chunk);

          // Prepare document for Pinecone
          allDocuments.push({
            id: `${content.source}-${Date.now()}-${i}-${j}`,
            embedding: embedding,
            metadata: {
              content: chunk,
              title:
                j === 0 ? content.title : `${content.title} (Part ${j + 1})`,
              url: content.url,
              source: content.source,
              publishedAt: content.publishedAt || new Date(),
            },
          });

          // Small delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        console.log(`  ✓ Created ${chunks.length} embeddings`);
      } catch (error: unknown) {
        console.error(
          `  ✗ Error processing document ${content.title}:`,
          error instanceof Error ? error.message : String(error),
        );
        // Continue with other documents
      }
    }

    // Step 2: Upsert ALL documents to Pinecone at once
    if (allDocuments.length > 0) {
      console.log(`\nUpserting ${allDocuments.length} vectors to Pinecone...`);
      await this.vectorService.upsertDocuments(allDocuments);
      console.log(`✓ Successfully upserted all ${allDocuments.length} vectors`);
    } else {
      console.log("⚠️  No documents to upsert");
    }
  }

  async refreshCryptoData(): Promise<void> {
    try {
      console.log("Refreshing crypto data from CoinGecko API...");

      // Fetch all CoinGecko data (coins, categories, trending, global)
      const content = await this.scraperService.getAllCoinGeckoData();
      await this.addMultipleDocuments(content);

      console.log(`Added ${content.length} items to knowledge base`);

      await this.vectorService.deleteOldDocuments(30);
    } catch (error: unknown) {
      console.error("Error refreshing crypto data:", error);
    }
  }

  async getRelevantContext(
    query: string,
    maxTokens: number = 2000,
  ): Promise<string> {
    try {
      const searchResults = await this.searchSimilarDocuments(query, 5, 0.3);

      if (searchResults.length === 0) {
        return "No relevant context found in the knowledge base.";
      }

      let context = "Relevant information from crypto knowledge base:\n\n";
      let currentTokens = context.length;

      for (const result of searchResults) {
        const resultText = `Source: ${result.source} | Score: ${(result.score * 100).toFixed(1)}%
Title: ${result.title}
Content: ${result.content}

---

`;

        if (currentTokens + resultText.length > maxTokens) {
          break;
        }

        context += resultText;
        currentTokens += resultText.length;
      }

      return context;
    } catch (error: unknown) {
      console.error("Error getting relevant context:", error);
      return "Error retrieving context from knowledge base.";
    }
  }

  private async initializeWithContent(): Promise<void> {
    try {
      // Check if we already have content in Pinecone
      const stats = await this.vectorService.getIndexStats();

      if (stats && stats.totalVectorCount > 0) {
        // Already have content in the index
        console.log(`Pinecone index has ${stats.totalVectorCount} vectors`);
        return;
      }

      console.log("Initializing with CoinGecko crypto content...");

      const content = await this.scraperService.getAllCoinGeckoData();
      await this.addMultipleDocuments(content);

      console.log("Content initialized successfully");
    } catch (error: unknown) {
      console.error("Error initializing content:", error);
    }
  }

  private chunkContent(content: string, chunkSize: number = 1000): string[] {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (
        currentChunk.length + sentence.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim() + ".");
        currentChunk = sentence.trim();
      } else {
        currentChunk += (currentChunk.length > 0 ? ". " : "") + sentence.trim();
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim() + ".");
    }

    return chunks.length > 0 ? chunks : [content];
  }
}
