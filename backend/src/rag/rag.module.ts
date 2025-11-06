import { Module } from "@nestjs/common";
import { RagService } from "./rag.service";
import { EmbeddingService } from "./embedding.service";
import { ScraperService } from "./scraper.service";
import { VectorService } from "./vector.service";
import { RagController } from "./rag.controller";
import { RagSchedulerService } from "./rag-scheduler.service";

@Module({
  controllers: [RagController],
  providers: [
    RagService,
    EmbeddingService,
    ScraperService,
    VectorService,
    RagSchedulerService,
  ],
  exports: [RagService, EmbeddingService, ScraperService, VectorService],
})
export class RagModule {}
