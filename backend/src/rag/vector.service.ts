import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pinecone } from "@pinecone-database/pinecone";

export interface VectorDocument {
  content: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: Date;
}

export interface SearchResult extends VectorDocument {
  id: string;
  score: number;
}

export interface IndexStats {
  totalVectorCount: number;
  dimension?: number;
  indexFullness?: number;
  namespaces?: Record<string, { recordCount: number }>;
}

@Injectable()
export class VectorService {
  private pinecone: Pinecone;
  private indexName = "crypto-knowledge";

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("PINECONE_API_KEY");

    if (apiKey) {
      this.pinecone = new Pinecone({
        apiKey: apiKey,
      });
    }
  }

  async initializeIndex(): Promise<void> {
    try {
      if (!this.pinecone) {
        return;
      }

      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(
        (index) => index.name === this.indexName,
      );

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 384,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });
      }
    } catch (error: unknown) {
      // Ignore initialization errors
    }
  }

  async upsertDocuments(
    documents: Array<{
      id: string;
      embedding: number[];
      metadata: VectorDocument;
    }>,
  ): Promise<void> {
    try {
      if (!this.pinecone) {
        throw new Error("Pinecone not initialized");
      }

      const index = this.pinecone.index(this.indexName);

      // Upsert vectors in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        const vectors = batch.map((doc) => ({
          id: doc.id,
          values: doc.embedding,
          metadata: {
            content: doc.metadata.content.substring(0, 40960), // Pinecone metadata limit
            title: doc.metadata.title,
            url: doc.metadata.url,
            source: doc.metadata.source,
            publishedAt:
              doc.metadata.publishedAt?.toISOString() ||
              new Date().toISOString(),
          },
        }));

        await index.upsert(vectors);
      }
    } catch (error: unknown) {
      throw error;
    }
  }

  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    try {
      if (!this.pinecone) {
        return [];
      }

      const index = this.pinecone.index(this.indexName);

      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
        filter: filter,
      });

      const results: SearchResult[] = [];

      if (queryResponse.matches) {
        for (const match of queryResponse.matches) {
          if (match.metadata) {
            results.push({
              id: match.id,
              content: match.metadata.content as string,
              title: match.metadata.title as string,
              url: match.metadata.url as string,
              source: match.metadata.source as string,
              publishedAt: new Date(match.metadata.publishedAt as string),
              score: match.score || 0,
            });
          }
        }
      }

      return results;
    } catch (error: unknown) {
      return [];
    }
  }

  async deleteBySource(source: string): Promise<number> {
    try {
      if (!this.pinecone) {
        return 0;
      }

      const index = this.pinecone.index(this.indexName);

      const statsBefore = await this.getIndexStats();
      const countBefore = statsBefore?.totalVectorCount || 0;

      if (countBefore === 0) {
        return 0;
      }

      try {
        await index.deleteMany({
          filter: {
            source: { $eq: source },
          },
        });
      } catch (deleteError: unknown) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
        if (errorMessage.includes('404')) {
          return 0;
        }
        throw deleteError;
      }

      const statsAfter = await this.getIndexStats();
      const countAfter = statsAfter?.totalVectorCount || 0;

      return countBefore - countAfter;
    } catch (error: unknown) {
      return 0;
    }
  }

  async deleteOldDocuments(daysOld: number = 30): Promise<void> {
    try {
      if (!this.pinecone) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const index = this.pinecone.index(this.indexName);

      // Delete documents older than cutoff date
      await index.deleteMany({
        filter: {
          publishedAt: { $lt: cutoffDate.toISOString() },
        },
      });
    } catch (error: unknown) {
      // Ignore cleanup errors
    }
  }

  async getIndexStats(): Promise<IndexStats | null> {
    try {
      if (!this.pinecone) return null;

      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();

      return {
        totalVectorCount: stats.totalRecordCount || 0,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: stats.namespaces,
      };
    } catch (error: unknown) {
      return null;
    }
  }

  async deleteIndex(): Promise<void> {
    try {
      if (!this.pinecone) {
        return;
      }

      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(
        (index) => index.name === this.indexName,
      );

      if (indexExists) {
        await this.pinecone.deleteIndex(this.indexName);
      }
    } catch (error: unknown) {
      throw error;
    }
  }

  async deleteAllVectors(): Promise<void> {
    try {
      if (!this.pinecone) {
        return;
      }

      const index = this.pinecone.index(this.indexName);
      await index.deleteAll();
    } catch (error: unknown) {
      throw error;
    }
  }
}
