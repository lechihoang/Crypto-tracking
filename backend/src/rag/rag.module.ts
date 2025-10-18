import { Module } from "@nestjs/common";
import { RagService } from "./rag.service";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";
import { VectorService } from "./vector.service";
import { RagController } from "./rag.controller";

@Module({
  controllers: [RagController],
  providers: [RagService, EmbeddingService, ScraperService, VectorService],
  exports: [RagService, EmbeddingService, ScraperService, VectorService],
})
export class RagModule {}
