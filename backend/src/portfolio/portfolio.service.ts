import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  PortfolioHolding,
  PortfolioSnapshot,
  PortfolioBenchmark,
} from "../entities";
import { CryptoService } from "../crypto/crypto.service";
import { CreateHoldingDto } from "./dto/create-holding.dto";
import { UpdateHoldingDto } from "./dto/update-holding.dto";

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(PortfolioHolding)
    private holdingRepository: Repository<PortfolioHolding>,
    @InjectRepository(PortfolioSnapshot)
    private snapshotRepository: Repository<PortfolioSnapshot>,
    @InjectRepository(PortfolioBenchmark)
    private benchmarkRepository: Repository<PortfolioBenchmark>,
    private cryptoService: CryptoService,
  ) {}

  async getHoldings(userId: string): Promise<PortfolioHolding[]> {
    return this.holdingRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async addHolding(
    userId: string,
    createHoldingDto: CreateHoldingDto,
  ): Promise<PortfolioHolding> {
    // Check if holding already exists
    const existingHolding = await this.holdingRepository.findOne({
      where: { userId, coinId: createHoldingDto.coinId },
    });

    if (existingHolding) {
      throw new ConflictException(
        "Holding for this coin already exists. Use update instead.",
      );
    }

    const holding = this.holdingRepository.create({
      userId,
      ...createHoldingDto,
    });

    return this.holdingRepository.save(holding);
  }

  async updateHolding(
    userId: string,
    holdingId: string,
    updateHoldingDto: UpdateHoldingDto,
  ): Promise<PortfolioHolding> {
    const holding = await this.holdingRepository.findOne({
      where: { id: holdingId, userId },
    });

    if (!holding) {
      throw new NotFoundException("Holding not found");
    }

    Object.assign(holding, updateHoldingDto);
    return this.holdingRepository.save(holding);
  }

  async removeHolding(userId: string, holdingId: string): Promise<void> {
    const result = await this.holdingRepository.delete({
      id: holdingId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException("Holding not found");
    }
  }

  async getPortfolioValue(userId: string): Promise<{
    totalValue: number;
    holdings: Array<{
      holding: PortfolioHolding;
      currentPrice: number;
      currentValue: number;
      profitLoss?: number;
      profitLossPercentage?: number;
    }>;
  }> {
    const holdings = await this.getHoldings(userId);

    if (holdings.length === 0) {
      return { totalValue: 0, holdings: [] };
    }

    // Get current prices for all coins
    const coinIds = holdings.map((h) => h.coinId);
    const prices = await this.cryptoService.getCoinPrices(coinIds);

    let totalValue = 0;
    const enrichedHoldings = holdings.map((holding) => {
      const priceData = prices[holding.coinId];
      const currentPrice = priceData?.usd || 0;
      const currentValue = holding.quantity * currentPrice;

      totalValue += currentValue;

      let profitLoss: number | undefined;
      let profitLossPercentage: number | undefined;

      if (holding.averageBuyPrice) {
        const totalCost = holding.quantity * holding.averageBuyPrice;
        profitLoss = currentValue - totalCost;
        profitLossPercentage =
          totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
      }

      return {
        holding,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercentage,
      };
    });

    return { totalValue, holdings: enrichedHoldings };
  }

  async createSnapshot(
    userId: string,
    totalValue: number,
  ): Promise<PortfolioSnapshot> {
    const snapshot = this.snapshotRepository.create({
      userId,
      totalValue,
    });

    return this.snapshotRepository.save(snapshot);
  }

  async getPortfolioHistory(
    userId: string,
    days: number = 30,
  ): Promise<PortfolioSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.snapshotRepository
      .createQueryBuilder("snapshot")
      .where("snapshot.userId = :userId", { userId })
      .andWhere("snapshot.snapshotDate >= :startDate", { startDate })
      .orderBy("snapshot.snapshotDate", "ASC")
      .getMany();
  }

  async getPortfolioValueHistory(userId: string, days: number = 30) {
    const holdings = await this.holdingRepository.find({
      where: { userId },
    });

    if (holdings.length === 0) {
      return { data: [] };
    }

    try {
      // Get historical prices for all coins in portfolio
      const coinIds = holdings.map((h) => h.coinId);
      const uniqueCoinIds = [...new Set(coinIds)];

      // Fetch price history for all coins with delays to respect rate limits
      const priceHistories: Array<{ coinId: string; prices: any[] }> = [];

      for (const coinId of uniqueCoinIds) {
        try {
          const response = await this.cryptoService.getCoinPriceHistory(
            coinId,
            days,
          );
          priceHistories.push({ coinId, prices: response.prices });
        } catch (error) {
          console.error(`Failed to fetch price history for ${coinId}:`, error);
          priceHistories.push({ coinId, prices: [] });
        }

        // Add small delay between requests to avoid overwhelming the API
        if (uniqueCoinIds.indexOf(coinId) < uniqueCoinIds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Create a map of coin prices by timestamp
      const priceMap = new Map<string, Map<number, number>>();
      priceHistories.forEach(({ coinId, prices }) => {
        const coinPriceMap = new Map<number, number>();
        prices.forEach((priceData: any) => {
          coinPriceMap.set(priceData.timestamp, priceData.price);
        });
        priceMap.set(coinId, coinPriceMap);
      });

      // Get all unique timestamps and sort them
      const allTimestamps = new Set<number>();
      priceHistories.forEach(({ prices }) => {
        prices.forEach((priceData: any) => {
          allTimestamps.add(priceData.timestamp);
        });
      });

      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

      // Calculate portfolio value at each timestamp
      const portfolioHistory = sortedTimestamps.map((timestamp) => {
        let totalValue = 0;

        holdings.forEach((holding) => {
          const coinPriceMap = priceMap.get(holding.coinId);
          if (coinPriceMap) {
            // Find the closest price to this timestamp
            let closestPrice = 0;
            let minTimeDiff = Infinity;

            for (const [priceTimestamp, price] of coinPriceMap.entries()) {
              const timeDiff = Math.abs(priceTimestamp - timestamp);
              if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestPrice = price;
              }
            }

            totalValue += Number(holding.quantity) * closestPrice;
          }
        });

        return {
          timestamp,
          totalValue,
          date: new Date(timestamp).toISOString(),
        };
      });

      return { data: portfolioHistory };
    } catch (error) {
      console.error("Error calculating portfolio value history:", error);
      return { data: [] };
    }
  }

  async setBenchmark(userId: string, benchmarkValue: number): Promise<PortfolioBenchmark> {
    // Check if benchmark already exists
    let benchmark = await this.benchmarkRepository.findOne({
      where: { userId },
    });

    if (benchmark) {
      // Update existing benchmark
      benchmark.benchmarkValue = benchmarkValue;
      benchmark.updatedAt = new Date();
    } else {
      // Create new benchmark
      benchmark = this.benchmarkRepository.create({
        userId,
        benchmarkValue,
      });
    }

    return this.benchmarkRepository.save(benchmark);
  }

  async getBenchmark(userId: string): Promise<PortfolioBenchmark | null> {
    return this.benchmarkRepository.findOne({
      where: { userId },
    });
  }

  async deleteBenchmark(userId: string): Promise<void> {
    await this.benchmarkRepository.delete({ userId });
  }
}
