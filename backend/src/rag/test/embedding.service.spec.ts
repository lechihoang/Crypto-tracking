/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EmbeddingService } from "../embedding.service";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("EmbeddingService", () => {
  let service: EmbeddingService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "HUGGINGFACE_API_KEY") return "test-api-key";
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createEmbedding", () => {
    it("should create a single embedding with correct dimensions", async () => {
      const testText = "Bitcoin is a decentralized cryptocurrency";
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());

      mockedAxios.post.mockResolvedValueOnce({
        data: [mockEmbedding], // HuggingFace returns nested array
      });

      const result = await service.createEmbedding(testText);

      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(384);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5",
        expect.objectContaining({
          inputs: expect.any(String),
          options: expect.objectContaining({
            wait_for_model: true,
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        }),
      );
    });

    it("should throw error when API call fails", async () => {
      const testText = "Test text";

      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(service.createEmbedding(testText)).rejects.toThrow();
    });

    it("should handle empty text", async () => {
      const mockEmbedding = new Array(384).fill(0);

      mockedAxios.post.mockResolvedValueOnce({
        data: [mockEmbedding], // Nested array
      });

      const result = await service.createEmbedding("");

      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(384);
    });
  });

  describe("createEmbeddings", () => {
    it("should create multiple embeddings", async () => {
      const testTexts = [
        "Ethereum is a blockchain platform",
        "DeFi stands for Decentralized Finance",
        "NFTs are non-fungible tokens",
      ];

      const mockEmbeddings = testTexts.map(() =>
        new Array(384).fill(0).map(() => Math.random()),
      );

      mockedAxios.post
        .mockResolvedValueOnce({ data: [mockEmbeddings[0]] })
        .mockResolvedValueOnce({ data: [mockEmbeddings[1]] })
        .mockResolvedValueOnce({ data: [mockEmbeddings[2]] });

      const result = await service.createEmbeddings(testTexts);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(mockEmbeddings[0]);
      expect(result[1]).toEqual(mockEmbeddings[1]);
      expect(result[2]).toEqual(mockEmbeddings[2]);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it("should handle empty array", async () => {
      const result = await service.createEmbeddings([]);

      expect(result).toEqual([]);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("should throw error if any embedding fails", async () => {
      const testTexts = ["Text 1", "Text 2"];

      mockedAxios.post
        .mockResolvedValueOnce({ data: [new Array(384).fill(0)] })
        .mockRejectedValueOnce(new Error("API Error"));

      await expect(service.createEmbeddings(testTexts)).rejects.toThrow();
    });
  });

  describe("cosine similarity calculation", () => {
    it("should calculate correct cosine similarity", () => {
      // Helper function to calculate cosine similarity
      const cosineSimilarity = (a: number[], b: number[]): number => {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(
          a.reduce((sum, val) => sum + val * val, 0),
        );
        const magnitudeB = Math.sqrt(
          b.reduce((sum, val) => sum + val * val, 0),
        );
        return dotProduct / (magnitudeA * magnitudeB);
      };

      // Identical vectors should have similarity close to 1
      const vec1 = [1, 2, 3, 4, 5];
      const vec2 = [1, 2, 3, 4, 5];
      const similarity1 = cosineSimilarity(vec1, vec2);
      expect(similarity1).toBeCloseTo(1, 5);

      // Orthogonal vectors should have similarity close to 0
      const vec3 = [1, 0, 0];
      const vec4 = [0, 1, 0];
      const similarity2 = cosineSimilarity(vec3, vec4);
      expect(similarity2).toBeCloseTo(0, 5);

      // Similar vectors should have high similarity
      const vec5 = [1, 2, 3];
      const vec6 = [1.1, 2.1, 3.1];
      const similarity3 = cosineSimilarity(vec5, vec6);
      expect(similarity3).toBeGreaterThan(0.99);
    });
  });

  describe("embedding validation", () => {
    it("should validate embedding dimensions", async () => {
      const testText = "Test text";
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());

      mockedAxios.post.mockResolvedValueOnce({
        data: [mockEmbedding], // Nested array
      });

      const result = await service.createEmbedding(testText);

      // Verify the embedding is a valid 384-dimension vector
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(384);
      expect(result.every((val) => typeof val === "number")).toBe(true);
    });

    it("should throw error for wrong dimension", async () => {
      const testText = "Test text";
      const wrongDimensionEmbedding = new Array(256).fill(0); // Wrong dimension

      mockedAxios.post.mockResolvedValueOnce({
        data: [wrongDimensionEmbedding],
      });

      // The service should throw error for wrong dimensions
      await expect(service.createEmbedding(testText)).rejects.toThrow();
    });
  });

  describe("API integration", () => {
    it("should use correct API endpoint", async () => {
      const testText = "Test";
      const mockEmbedding = new Array(384).fill(0);

      mockedAxios.post.mockResolvedValueOnce({
        data: [mockEmbedding],
      });

      await service.createEmbedding(testText);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("huggingface.co"),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it("should include authorization header", async () => {
      const testText = "Test";
      const mockEmbedding = new Array(384).fill(0);

      mockedAxios.post.mockResolvedValueOnce({
        data: [mockEmbedding],
      });

      await service.createEmbedding(testText);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        }),
      );
    });

    it("should set wait_for_model option", async () => {
      const testText = "Test";
      const mockEmbedding = new Array(384).fill(0);

      mockedAxios.post.mockResolvedValueOnce({
        data: [mockEmbedding],
      });

      await service.createEmbedding(testText);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          options: expect.objectContaining({
            wait_for_model: true,
          }),
        }),
        expect.any(Object),
      );
    });
  });
});
