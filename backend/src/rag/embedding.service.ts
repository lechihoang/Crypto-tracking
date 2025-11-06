import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class EmbeddingService {
  private readonly huggingFaceApiKey: string;
  private readonly huggingFaceBaseUrl = "https://router.huggingface.co/hf-inference";
  private readonly modelName = "BAAI/bge-small-en-v1.5";
  private readonly embeddingDimension = 384; // bge-small-en-v1.5 dimensions

  constructor(private configService: ConfigService) {
    this.huggingFaceApiKey =
      this.configService.get<string>("HUGGINGFACE_API_KEY") || "";
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      // Clean and truncate text to avoid API limits
      const cleanText = this.cleanText(text);

      const response = await axios.post<number[] | number[][]>(
        `${this.huggingFaceBaseUrl}/models/${this.modelName}`,
        {
          inputs: cleanText, // Single text string
          options: {
            wait_for_model: true,
            use_cache: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.huggingFaceApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        },
      );

      // HuggingFace returns embedding as nested array
      const embedding: number[] | number[][] = response.data;

      if (!Array.isArray(embedding)) {
        throw new Error("Invalid embedding response from HuggingFace");
      }

      // BGE model returns format: [[embedding_vector]]
      let finalEmbedding: number[];
      if (Array.isArray(embedding[0])) {
        finalEmbedding = embedding[0];
      } else {
        finalEmbedding = embedding as number[];
      }

      // Validate embedding dimensions
      if (
        !finalEmbedding ||
        finalEmbedding.length !== this.embeddingDimension
      ) {
        throw new Error(
          `Expected ${this.embeddingDimension} dimensions, got ${finalEmbedding?.length || 0}`,
        );
      }

      return finalEmbedding;
    } catch (error: unknown) {
      console.error("Embedding service error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new HttpException(
            "HuggingFace API authentication failed. Please check your API key.",
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (error.response?.status === 429) {
          throw new HttpException(
            "HuggingFace API rate limit exceeded. Please try again later.",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (error.response?.status === 503) {
          throw new HttpException(
            "HuggingFace model is loading. Please wait and try again.",
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      throw new HttpException(
        "Failed to create embedding. Please try again.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // Process texts in batches to avoid API limits
      const batchSize = 10;
      const results: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map((text) => this.createEmbedding(text));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error: unknown) {
      console.error("Batch embedding error:", error);
      throw error;
    }
  }

  private cleanText(text: string): string {
    return (
      text
        .trim()
        .replace(/\s+/g, " ") // Replace multiple whitespace with single space
        // eslint-disable-next-line no-useless-escape
        .replace(/[^\w\s\-\.,!?;:()\[\]{}'"]/g, "") // Remove special characters except common punctuation
        .substring(0, 500)
    ); // Truncate to 500 chars to stay within limits
  }
}
