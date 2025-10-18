import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioService } from "./portfolio.service";
import {
  PortfolioHolding,
  PortfolioSnapshot,
  PortfolioBenchmark,
} from "../entities";
import { CryptoModule } from "../crypto/crypto.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortfolioHolding,
      PortfolioSnapshot,
      PortfolioBenchmark,
    ]),
    CryptoModule,
    AuthModule,
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
