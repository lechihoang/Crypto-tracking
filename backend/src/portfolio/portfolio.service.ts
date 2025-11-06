import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PortfolioHolding } from "../schemas/portfolio-holding.schema";
import { PortfolioSnapshot } from "../schemas/portfolio-snapshot.schema";
import { User } from "../schemas/user.schema";
import { CryptoService } from "../crypto/crypto.service";
import { CreateHoldingDto } from "./dto/create-holding.dto";
import { UpdateHoldingDto } from "./dto/update-holding.dto";

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(PortfolioHolding.name)
    private holdingModel: Model<PortfolioHolding>,
    @InjectModel(PortfolioSnapshot.name)
    private snapshotModel: Model<PortfolioSnapshot>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private cryptoService: CryptoService
  ) {}

  async getHoldings(userId: string): Promise<PortfolioHolding[]> {
    return this.holdingModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async addHolding(
    userId: string,
    createHoldingDto: CreateHoldingDto
  ): Promise<PortfolioHolding> {
    // Check if holding already exists
    const existingHolding = await this.holdingModel
      .findOne({ userId, coinId: createHoldingDto.coinId })
      .exec();

    if (existingHolding) {
      throw new ConflictException(
        "Holding for this coin already exists. Use update instead."
      );
    }

    const holding = new this.holdingModel({
      userId,
      ...createHoldingDto,
    });

    return holding.save();
  }

  async updateHolding(
    userId: string,
    holdingId: string,
    updateHoldingDto: UpdateHoldingDto
  ): Promise<PortfolioHolding> {
    const holding = await this.holdingModel
      .findOne({ _id: holdingId, userId })
      .exec();

    if (!holding) {
      throw new NotFoundException("Holding not found");
    }

    Object.assign(holding, updateHoldingDto);
    return holding.save();
  }

  async removeHolding(userId: string, holdingId: string): Promise<void> {
    const result = await this.holdingModel
      .deleteOne({
        _id: holdingId,
        userId,
      })
      .exec();

    if (result.deletedCount === 0) {
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
    totalValue: number
  ): Promise<PortfolioSnapshot> {
    const snapshot = new this.snapshotModel({
      userId,
      totalValue,
    });

    return snapshot.save();
  }

  async getPortfolioHistory(
    userId: string,
    days: number = 30
  ): Promise<PortfolioSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.snapshotModel
      .find({
        userId,
        snapshotDate: { $gte: startDate },
      })
      .sort({ snapshotDate: 1 })
      .exec();
  }

  async getPortfolioValueHistory(userId: string, days: number = 30) {
    const holdings = await this.holdingModel.find({ userId }).exec();

    if (holdings.length === 0) {
      return { data: [] };
    }

    try {
      // Get historical prices for all coins in portfolio
      const coinIds = holdings.map((h) => h.coinId);
      const uniqueCoinIds = [...new Set(coinIds)];

      // Fetch price history for all coins with delays to respect rate limits
      const priceHistories: Array<{
        coinId: string;
        prices: Array<{ timestamp: number; price: number }>;
      }> = [];

      for (const coinId of uniqueCoinIds) {
        try {
          const response = await this.cryptoService.getCoinPriceHistory(
            coinId,
            days
          );
          priceHistories.push({ coinId, prices: response.prices });
        } catch (error: unknown) {
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
        prices.forEach((priceData) => {
          coinPriceMap.set(priceData.timestamp, priceData.price);
        });
        priceMap.set(coinId, coinPriceMap);
      });

      // Get all unique timestamps and sort them
      const allTimestamps = new Set<number>();
      priceHistories.forEach(({ prices }) => {
        prices.forEach((priceData) => {
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
    } catch (error: unknown) {
      console.error("Error calculating portfolio value history:", error);
      return { data: [] };
    }
  }

  async setBenchmark(
  userId: string,
  benchmarkValue: number,
): Promise<{ userId: string; benchmarkValue: number }> {
  // Update benchmarkValue in User document
  const user = await this.userModel.findOneAndUpdate(
    { userId },
    { benchmarkValue },
    { new: true, upsert: true }
  ).exec();

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return {
    userId: user.userId,
    benchmarkValue: user.benchmarkValue,
  };
}

  async getBenchmark(userId: string): Promise<{ userId: string; benchmarkValue: number; updatedAt: Date } | null> {
  const user = await this.userModel.findOne({ userId }).exec();

  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    benchmarkValue: user.benchmarkValue,
    updatedAt: (user as any).updatedAt,
  };
}

async deleteBenchmark(userId: string): Promise<void> {
  // Set benchmarkValue back to 0 instead of deleting
  const user = await this.userModel.findOneAndUpdate(
    { userId },
    { benchmarkValue: 0 },
    { new: true }
  ).exec();

  if (!user) {
    throw new NotFoundException('User not found');
  }
}
}
