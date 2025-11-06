import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EmbeddingService } from "../rag/embedding.service";
import { VectorService } from "../rag/vector.service";
import { RagService } from "../rag/rag.service";
import { ScraperService } from "../rag/scraper.service";

/**
 * RAG System Integration Tests
 *
 * These tests verify the integration between RAG components:
 * - EmbeddingService (HuggingFace API)
 * - VectorService (Pinecone)
 * - ScraperService (Web scraping)
 * - RagService (Orchestration)
 *
 * NOTE: These tests require actual API keys in .env:
 * - HUGGINGFACE_API_KEY
 * - PINECONE_API_KEY
 *
 * Run with: npm test -- rag-integration.spec.ts
 */

describe("RAG System Integration Tests", () => {
  let app: INestApplication;
  let embeddingService: EmbeddingService;
  let vectorService: VectorService;
  let ragService: RagService;
  let scraperService: ScraperService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env",
        }),
      ],
      providers: [EmbeddingService, VectorService, RagService, ScraperService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    embeddingService = moduleFixture.get<EmbeddingService>(EmbeddingService);
    vectorService = moduleFixture.get<VectorService>(VectorService);
    ragService = moduleFixture.get<RagService>(RagService);
    scraperService = moduleFixture.get<ScraperService>(ScraperService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("EmbeddingService Integration", () => {
    it("should create embedding from HuggingFace API", async () => {
      const text = "Bitcoin is a decentralized cryptocurrency";
      const embedding = await embeddingService.createEmbedding(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384); // bge-small-en-v1.5 dimension
      expect(embedding.every((val) => typeof val === "number")).toBe(true);
    }, 30000); // 30 second timeout for API call

    it("should create multiple embeddings", async () => {
      const texts = [
        "Ethereum is a blockchain platform",
        "DeFi stands for Decentralized Finance",
      ];

      const embeddings = await embeddingService.createEmbeddings(texts);

      expect(embeddings).toBeDefined();
      expect(embeddings.length).toBe(2);
      expect(embeddings[0].length).toBe(384);
      expect(embeddings[1].length).toBe(384);
    }, 60000);

    it("should produce similar embeddings for similar texts", async () => {
      const text1 = "Bitcoin cryptocurrency";
      const text2 = "Bitcoin digital currency";
      const text3 = "Ethereum smart contracts";

      const [emb1, emb2, emb3] = await Promise.all([
        embeddingService.createEmbedding(text1),
        embeddingService.createEmbedding(text2),
        embeddingService.createEmbedding(text3),
      ]);

      const similarity12 = cosineSimilarity(emb1, emb2);
      const similarity13 = cosineSimilarity(emb1, emb3);

      // Bitcoin-Bitcoin should be more similar than Bitcoin-Ethereum
      expect(similarity12).toBeGreaterThan(similarity13);
      expect(similarity12).toBeGreaterThan(0.7); // High similarity threshold
    }, 60000);
  });

  describe("VectorService Integration", () => {
    beforeAll(async () => {
      await vectorService.initializeIndex();
    }, 30000);

    it("should initialize Pinecone index", async () => {
      const stats = await vectorService.getIndexStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalVectorCount");
      expect(stats).toHaveProperty("dimension");
      if (stats && typeof stats === "object" && "dimension" in stats) {
        expect(stats.dimension).toBe(384);
      }
    }, 30000);

    it("should add and search documents", async () => {
      const testContent =
        "Bitcoin is the first cryptocurrency created by Satoshi Nakamoto";
      const embedding = await embeddingService.createEmbedding(testContent);

      const testDoc = {
        id: `test-${Date.now()}`,
        embedding,
        metadata: {
          content: testContent,
          title: "Bitcoin Test",
          url: "https://test.com/bitcoin",
          source: "Test",
          publishedAt: new Date(),
        },
      };

      // Add document
      await vectorService.upsertDocuments([testDoc]);

      // Wait for indexing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Search
      const queryEmbedding =
        await embeddingService.createEmbedding("What is Bitcoin?");
      const results = await vectorService.searchSimilar(queryEmbedding, 5);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Should find at least our test document
      const foundTestDoc = results.find((r) => r.title === "Bitcoin Test");
      expect(foundTestDoc).toBeDefined();
    }, 60000);
  });

  describe("RagService Integration", () => {
    it("should search for similar documents", async () => {
      const query = "What is Bitcoin?";
      const results = await ragService.searchSimilarDocuments(query, 3, 0.3);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Results should have required fields
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("content");
        expect(results[0]).toHaveProperty("title");
        expect(results[0]).toHaveProperty("score");
      }
    }, 30000);

    it("should add document to RAG system", async () => {
      const scrapedContent = {
        title: "Test Article about Ethereum",
        content:
          "Ethereum is a decentralized platform that runs smart contracts. It was created by Vitalik Buterin in 2015.",
        url: "https://test.com/ethereum",
        source: "Test",
        publishedAt: new Date(),
      };

      await expect(
        ragService.addDocument(scrapedContent),
      ).resolves.not.toThrow();

      // Wait for indexing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify it's searchable
      const results = await ragService.searchSimilarDocuments(
        "Ethereum smart contracts",
        5,
        0.3,
      );

      const foundDoc = results.find((r) => r.title === scrapedContent.title);
      expect(foundDoc).toBeDefined();
    }, 60000);
  });

  describe("ScraperService Integration", () => {
    it("should scrape content from CoinGecko API", async () => {
      const data = await scraperService.getAllCoinGeckoData();

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      // getAllCoinGeckoData combines categories (~100+), trending (~7), and global (~3)
      // So total should be > 100 items
      expect(data.length).toBeGreaterThan(100);

      // Verify structure
      if (data.length > 0) {
        const item = data[0];
        if (item) {
          expect(item).toHaveProperty("title");
          expect(item).toHaveProperty("content");
          expect(item).toHaveProperty("url");
          expect(item).toHaveProperty("source");
          // Source should be one of the CoinGecko API sources
          expect(item.source).toMatch(/CoinGecko API/);
        }
      }
    }, 30000);

    it("should scrape trending data", async () => {
      const articles = await scraperService.getTrendingData();

      expect(articles).toBeDefined();
      expect(Array.isArray(articles)).toBe(true);

      if (articles.length > 0) {
        const article = articles[0];
        if (article) {
          expect(article).toHaveProperty("title");
          expect(article).toHaveProperty("content");
          expect(article).toHaveProperty("url");
          expect(article).toHaveProperty("source");
          expect(article.content.length).toBeGreaterThan(10);
        }
      }
    }, 30000);
  });

  describe("Full RAG Workflow", () => {
    it("should complete full workflow: scrape -> embed -> store -> search", async () => {
      // 1. Scrape data
      const scrapedContent = await scraperService.getAllCoinGeckoData();
      expect(scrapedContent.length).toBeGreaterThan(0);

      if (scrapedContent.length === 0) {
        return; // Skip if no content
      }

      // 2. Add to RAG system (embeds and stores)
      const content = scrapedContent[0];
      if (!content) {
        return;
      }

      await ragService.addDocument(content);

      // Wait for indexing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Search for it
      const titleWords = content.title.split(" ");
      if (titleWords.length < 3) {
        return;
      }
      const searchQuery = titleWords.slice(0, 3).join(" "); // First 3 words
      const results = await ragService.searchSimilarDocuments(
        searchQuery,
        5,
        0.2,
      );

      // 4. Verify found
      expect(results.length).toBeGreaterThan(0);
      const firstTitleWord = titleWords[0];
      if (firstTitleWord) {
        const found = results.find((r) =>
          r.title.toLowerCase().includes(firstTitleWord.toLowerCase()),
        );
        expect(found).toBeDefined();
      }
    }, 120000);
  });
});

// Helper function
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
