import {
  Injectable,
  OnModuleInit,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";
import { VectorService, SearchResult, IndexStats } from "./vector.service";
import { ScrapedContent } from "./dto";
import { chunkContent } from "../common/utils/text.utils";

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private embeddingService: EmbeddingService,
    private scraperService: ScraperService,
    private vectorService: VectorService,
  ) {}

  // Lifecycle Methods

  async onModuleInit(): Promise<void> {
    await this.vectorService.initializeIndex();
  }


  /**
   * Search for similar documents in the knowledge base using semantic search
   * @param query - The search query text
   * @param limit - Maximum number of results to return (default: 5)
   * @param threshold - Minimum similarity score threshold (0-1, default: 0.5)
   * @returns Array of search results with content, title, score, and metadata
   * @throws HttpException if search fails
   */
  async searchSimilarDocuments(
    query: string,
    limit: number = 5,
    threshold: number = 0.5,
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingService.createEmbedding(query);

      const results = await this.vectorService.searchSimilar(
        queryEmbedding,
        limit,
      );

      const filteredResults = results.filter(
        (result) => result.score >= threshold,
      );

      return filteredResults;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to search similar documents for query: "${query.substring(0, 50)}..." - ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        "Failed to search knowledge base. Please try again later.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get relevant context from the knowledge base for a given query
   * Used by the chatbot to provide context-aware responses
   * @param query - The query to search for
   * @param maxTokens - Maximum number of tokens/characters to return (default: 2000)
   * @returns Formatted context string with relevant information
   */
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
      return "Error retrieving context from knowledge base.";
    }
  }


  /**
   * Add a single document to the knowledge base
   * @param content - The scraped content to add (title, content, url, source, publishedAt)
   * @throws HttpException if document cannot be added
   */
  async addDocument(content: ScrapedContent): Promise<void> {
    try {
      await this.addMultipleDocuments([content]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to add document "${content.title}" from ${content.url} - ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        `Failed to add document to knowledge base: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Add multiple documents to the knowledge base in batch
   * Handles deduplication, chunking, embedding generation, and vector storage
   * @param contents - Array of scraped content to add
   * @throws HttpException if batch processing fails
   */
  async addMultipleDocuments(contents: ScrapedContent[]): Promise<void> {
    try {
      this.logger.log(`Starting to process ${contents.length} documents`);

      // Deduplicate by URL
      const uniqueContents = Array.from(
        new Map(contents.map((item) => [item.url, item])).values(),
      );

      if (uniqueContents.length < contents.length) {
        this.logger.log(
          `Removed ${contents.length - uniqueContents.length} duplicate articles`,
        );
      }

      this.logger.log(
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

      const failedDocuments: Array<{
        title: string;
        url: string;
        error: string;
      }> = [];

      // Step 1: Create embeddings for ALL unique documents
      for (let i = 0; i < uniqueContents.length; i++) {
        const content = uniqueContents[i];
        try {
          const chunks = chunkContent(content.content, 1000);

          for (let j = 0; j < chunks.length; j++) {
            const chunk = chunks[j];

            try {
              // Create embedding for the chunk
              const embedding =
                await this.embeddingService.createEmbedding(chunk);

              // Prepare document for Pinecone with stable ID
              allDocuments.push({
                id: this.generateDocumentId(content.url, j),
                embedding: embedding,
                metadata: {
                  content: chunk,
                  title:
                    j === 0
                      ? content.title
                      : `${content.title} (Part ${j + 1})`,
                  url: content.url,
                  source: content.source,
                  publishedAt: content.publishedAt || new Date(),
                },
              });

              // Small delay to respect rate limits
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (embeddingError: unknown) {
              const errorMessage =
                embeddingError instanceof Error
                  ? embeddingError.message
                  : String(embeddingError);

              if (
                embeddingError instanceof HttpException &&
                embeddingError.getStatus() === HttpStatus.TOO_MANY_REQUESTS
              ) {
                this.logger.warn(
                  `Rate limit hit while processing chunk ${j + 1} of "${content.title}". Waiting 5 seconds before retry...`,
                );

                // Wait longer for rate limit errors
                await new Promise((resolve) => setTimeout(resolve, 5000));

                // Retry once
                try {
                  const embedding =
                    await this.embeddingService.createEmbedding(chunk);
                  allDocuments.push({
                    id: this.generateDocumentId(content.url, j),
                    embedding: embedding,
                    metadata: {
                      content: chunk,
                      title:
                        j === 0
                          ? content.title
                          : `${content.title} (Part ${j + 1})`,
                      url: content.url,
                      source: content.source,
                      publishedAt: content.publishedAt || new Date(),
                    },
                  });
                } catch (retryError: unknown) {
                  const retryErrorMessage =
                    retryError instanceof Error
                      ? retryError.message
                      : String(retryError);
                  this.logger.error(
                    `  ✗ Retry failed for chunk ${j + 1} of "${content.title}": ${retryErrorMessage}`,
                  );
                  throw retryError; // Propagate to outer catch
                }
              } else {
                // For non-rate-limit errors, log and propagate
                this.logger.error(
                  `  ✗ Error creating embedding for chunk ${j + 1} of "${content.title}": ${errorMessage}`,
                );
                throw embeddingError;
              }
            }
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;

          this.logger.error(
            `  ✗ Failed to process document "${content.title}" from ${content.url}: ${errorMessage}`,
            errorStack,
          );

          // Track failed documents
          failedDocuments.push({
            title: content.title,
            url: content.url,
            error: errorMessage,
          });

          // Continue with other documents instead of failing completely
        }
      }

      // Step 2: Upsert ALL documents to Pinecone at once
      if (allDocuments.length > 0) {
        try {
          this.logger.log(
            `Upserting ${allDocuments.length} vectors to Pinecone...`,
          );
          await this.vectorService.upsertDocuments(allDocuments);
          this.logger.log(
            `✓ Successfully upserted ${allDocuments.length} vectors`,
          );
        } catch (upsertError: unknown) {
          const errorMessage =
            upsertError instanceof Error
              ? upsertError.message
              : String(upsertError);
          const errorStack =
            upsertError instanceof Error ? upsertError.stack : undefined;

          this.logger.error(
            `Failed to upsert documents to Pinecone: ${errorMessage}`,
            errorStack,
          );

          throw new HttpException(
            `Failed to save documents to vector database: ${errorMessage}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        this.logger.warn("⚠️  No documents were successfully processed");

        if (failedDocuments.length > 0) {
          throw new HttpException(
            `All ${failedDocuments.length} documents failed to process. Check logs for details.`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      // Log summary
      if (failedDocuments.length > 0) {
        this.logger.warn(
          `Completed with ${failedDocuments.length} failed documents out of ${uniqueContents.length} total`,
        );
      } else {
        this.logger.log(
          `Successfully processed all ${uniqueContents.length} documents`,
        );
      }
    } catch (error: unknown) {
      // If error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Otherwise wrap in HttpException
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Unexpected error in addMultipleDocuments: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        `Failed to add documents to knowledge base: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Refresh crypto data from CoinGecko API and update the knowledge base
   * Uses source-based cleanup to prevent duplicates
   * @throws HttpException if refresh fails after max retries
   */
  async refreshCryptoData(): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        this.logger.log(
          `[RAG Refresh] Starting crypto data refresh (attempt ${attempt}/${maxRetries})...`,
        );

        // Get stats before refresh
        const statsBefore = await this.vectorService.getIndexStats();
        const vectorCountBefore = statsBefore?.totalVectorCount || 0;
        this.logger.log(
          `[RAG Refresh] Vector count before refresh: ${vectorCountBefore}`,
        );

        // Fetch all CoinGecko data (categories, trending, global)
        const content = await this.scraperService.getAllCoinGeckoData();

        if (!content || content.length === 0) {
          this.logger.warn("No content fetched from CoinGecko API");
          throw new Error("No data received from CoinGecko API");
        }

        this.logger.log(
          `[RAG Refresh] Fetched ${content.length} items from CoinGecko API`,
        );

        // Group content by source
        const contentBySource = this.groupBySource(content);
        this.logger.log(
          `[RAG Refresh] Grouped into ${Object.keys(contentBySource).length} sources`,
        );

        // Process each source: delete old → add new
        let totalDeleted = 0;
        let totalAdded = 0;

        for (const [source, items] of Object.entries(contentBySource)) {
          try {
            this.logger.log(
              `[RAG Refresh] Processing source: ${source} (${items.length} items)`,
            );

            // Delete old vectors from this source
            const deletedCount = await this.vectorService.deleteBySource(
              source,
            );
            totalDeleted += deletedCount;

            await this.addMultipleDocuments(items);
            totalAdded += items.length;

            this.logger.log(
              `[RAG Refresh] ✓ Completed ${source}: deleted ${deletedCount}, added ${items.length}`,
            );
          } catch (sourceError: unknown) {
            const errorMessage =
              sourceError instanceof Error
                ? sourceError.message
                : String(sourceError);
            this.logger.error(
              `[RAG Refresh] Failed to process source ${source}: ${errorMessage}`,
            );
            // Continue with other sources
          }
        }

        // Get stats after refresh
        const statsAfter = await this.vectorService.getIndexStats();
        const vectorCountAfter = statsAfter?.totalVectorCount || 0;

        this.logger.log(
          `[RAG Refresh] ✓ Refresh completed successfully`,
        );
        this.logger.log(
          `[RAG Refresh] Summary: Deleted ${totalDeleted} old vectors, added ${totalAdded} new items`,
        );
        this.logger.log(
          `[RAG Refresh] Vector count: ${vectorCountBefore} → ${vectorCountAfter}`,
        );

        return; // Success - exit the retry loop
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        const isTransientError = this.isTransientError(error);

        if (attempt < maxRetries && isTransientError) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff: 1s, 2s, 4s (max 10s)
          this.logger.warn(
            `[RAG Refresh] Transient error (attempt ${attempt}/${maxRetries}): ${errorMessage}. Retrying in ${waitTime}ms...`,
            errorStack,
          );

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue; // Retry
        } else {
          // Non-transient error or max retries reached
          this.logger.error(
            `[RAG Refresh] Failed after ${attempt} attempt(s): ${errorMessage}`,
            errorStack,
          );

          throw new HttpException(
            `Failed to refresh crypto data: ${errorMessage}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }
    }
  }


  /**
   * Generate a stable document ID based on URL and chunk index
   * This ensures the same content always gets the same ID, preventing duplicates
   */
  private generateDocumentId(url: string, chunkIndex: number = 0): string {
    // Sanitize URL to create a stable, filesystem-safe ID
    // Remove protocol, special chars, and convert to lowercase
    const sanitized = url
      .replace(/^https?:\/\//, "") // Remove protocol
      .replace(/[^a-zA-Z0-9-]/g, "-") // Replace special chars with dash
      .replace(/-+/g, "-") // Replace multiple dashes with single dash
      .replace(/^-|-$/g, "") // Remove leading/trailing dashes
      .toLowerCase()
      .substring(0, 200); // Limit length

    return `${sanitized}-${chunkIndex}`;
  }

  /**
   * Group scraped content by source for batch processing
   */
  private groupBySource(
    contents: ScrapedContent[],
  ): Record<string, ScrapedContent[]> {
    const grouped: Record<string, ScrapedContent[]> = {};

    for (const content of contents) {
      if (!grouped[content.source]) {
        grouped[content.source] = [];
      }
      grouped[content.source].push(content);
    }

    return grouped;
  }

  /**
   * Determines if an error is transient and should be retried
   */
  private isTransientError(error: unknown): boolean {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      // Retry on rate limits, service unavailable, gateway errors
      return (
        status === HttpStatus.TOO_MANY_REQUESTS ||
        status === HttpStatus.SERVICE_UNAVAILABLE ||
        status === HttpStatus.BAD_GATEWAY ||
        status === HttpStatus.GATEWAY_TIMEOUT
      );
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Retry on network errors, timeouts, connection issues
      return (
        message.includes("timeout") ||
        message.includes("network") ||
        message.includes("econnrefused") ||
        message.includes("econnreset") ||
        message.includes("etimedout") ||
        message.includes("rate limit")
      );
    }

    return false;
  }
}
