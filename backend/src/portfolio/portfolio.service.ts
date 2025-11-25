import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PortfolioHolding } from "../schemas/portfolio-holding.schema";
import { PortfolioSnapshot } from "../schemas/portfolio-snapshot.schema";
import { CryptoService } from "../crypto/crypto.service";
import { CreateHoldingDto } from "./dto/create-holding.dto";
import { UpdateHoldingDto } from "./dto/update-holding.dto";

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @InjectModel(PortfolioHolding.name)
    private holdingModel: Model<PortfolioHolding>,
    @InjectModel(PortfolioSnapshot.name)
    private snapshotModel: Model<PortfolioSnapshot>,
    private cryptoService: CryptoService,
  ) {}


  /**
   * Get all portfolio holdings for a user with coin information populated
   * @param userId - The user ID to fetch holdings for
   * @returns Array of portfolio holdings with coin details
   * @throws HttpException if fetch fails
   */
  async getHoldings(userId: string): Promise<PortfolioHolding[]> {
    try {
      const holdings = await this.holdingModel.find({ userId }).exec();
      return this.populateCoinInfo(holdings);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to fetch holdings for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to fetch portfolio holdings. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addHolding(
    userId: string,
    createHoldingDto: CreateHoldingDto,
  ): Promise<PortfolioHolding> {
    try {

      const existingHolding = await this.holdingModel
        .findOne({ userId, coinId: createHoldingDto.coinId })
        .exec();

      if (existingHolding) {
        this.logger.warn(
          `Holding for coin ${createHoldingDto.coinId} already exists for user ${userId}`,
        );
        throw new ConflictException(
          "Holding for this coin already exists. Use update instead.",
        );
      }

      const holding = new this.holdingModel({
        userId,
        coinId: createHoldingDto.coinId,
        quantity: createHoldingDto.quantity,
        averageBuyPrice: createHoldingDto.averageBuyPrice,
        notes: createHoldingDto.notes,
      });

      const savedHolding = await holding.save();


      const populated = await this.populateCoinInfo([savedHolding]);
      return populated[0];
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to add holding for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to add holding. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateHolding(
    userId: string,
    holdingId: string,
    updateHoldingDto: UpdateHoldingDto,
  ): Promise<PortfolioHolding> {
    try {
      const holding = await this.holdingModel.findOne({ _id: holdingId, userId }).exec();

      if (!holding) {
        this.logger.warn(`Holding ${holdingId} not found for user ${userId}`);
        throw new NotFoundException("Holding not found");
      }

      Object.assign(holding, updateHoldingDto);
      const savedHolding = await holding.save();


      const populated = await this.populateCoinInfo([savedHolding]);
      return populated[0];
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to update holding ${holdingId} for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to update holding. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeHolding(userId: string, holdingId: string): Promise<void> {
    try {
      const result = await this.holdingModel.deleteOne({ _id: holdingId, userId }).exec();

      if (result.deletedCount === 0) {
        this.logger.warn(`Holding ${holdingId} not found for user ${userId}`);
        throw new NotFoundException("Holding not found");
      }

    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to remove holding ${holdingId} for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to remove holding. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calculate the current total portfolio value and individual holding values
   * Includes profit/loss calculations based on average buy price
   * @param userId - The user ID to calculate portfolio value for
   * @returns Object containing total value and enriched holdings with current prices and P/L
   * @throws HttpException if calculation fails or prices cannot be fetched
   */
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
    try {
      const holdings = await this.holdingModel.find({ userId }).exec();

      if (holdings.length === 0) {
        return { totalValue: 0, holdings: [] };
      }

      // Populate coin info (name, symbol, image) from CoinGecko API
      const populatedHoldings = await this.populateCoinInfo(holdings);

      const coinIds = holdings.map((h) => h.coinId);
      let prices: Record<string, { usd: number }>;
      try {
        prices = await this.cryptoService.getCoinPrices(coinIds);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          `Failed to fetch coin prices for user ${userId}: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );

        throw new HttpException(
          "Failed to fetch current coin prices. Please try again later.",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      let totalValue = 0;
      const enrichedHoldings = populatedHoldings.map((holding) => {
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
          holding, // Now has coinName, coinSymbol, coinImage populated
          currentPrice,
          currentValue,
          profitLoss,
          profitLossPercentage,
        };
      });


      return { totalValue, holdings: enrichedHoldings };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to calculate portfolio value for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to calculate portfolio value. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get historical portfolio value over a specified time period
   * Calculates portfolio value at each timestamp based on historical prices
   * @param userId - The user ID to fetch history for
   * @param days - Number of days of history to fetch (default: 30)
   * @returns Object containing array of historical data points with timestamp, value, and date
   * @throws HttpException if history calculation fails
   */
  async getPortfolioValueHistory(userId: string, days: number = 30) {
    const holdings = await this.holdingModel.find({ userId }).exec();

    if (holdings.length === 0) {
      return { data: [] };
    }

    try {
      const coinIds = holdings.map((h) => h.coinId);


      const priceHistories = await this.fetchPriceHistories(coinIds, days);
      const { priceMap, sortedTimestamps } = this.buildPriceMap(priceHistories);
      const portfolioHistory = this.calculatePortfolioHistory(
        holdings,
        priceMap,
        sortedTimestamps,
      );


      return { data: portfolioHistory };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to calculate portfolio value history for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to calculate portfolio value history. Please try again later.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }


  async setBenchmark(
    userId: string,
    benchmarkValue: number,
  ): Promise<{ userId: string; benchmarkValue: number }> {
    try {

      // Update or create a single benchmark document for this user
      const snapshot = await this.snapshotModel
        .findOneAndUpdate(
          { userId },
          { benchmarkValue },
          { new: true, upsert: true },
        )
        .exec();

      if (!snapshot) {
        this.logger.error(`Failed to set benchmark for user ${userId}`);
        throw new NotFoundException("Failed to set benchmark");
      }

      return { userId: snapshot.userId, benchmarkValue: snapshot.benchmarkValue };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to set benchmark for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to set benchmark. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBenchmark(userId: string): Promise<{
    userId: string;
    benchmarkValue: number;
    updatedAt: Date;
  } | null> {
    try {
      const snapshot = await this.snapshotModel.findOne({ userId }).exec();

      if (!snapshot) {
        return null;
      }

      return {
        userId: snapshot.userId,
        benchmarkValue: snapshot.benchmarkValue,
        updatedAt: (snapshot as any).updatedAt || new Date(),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to fetch benchmark for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to fetch benchmark. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteBenchmark(userId: string): Promise<void> {
    try {
      const snapshot = await this.snapshotModel.findOneAndDelete({ userId }).exec();

      if (!snapshot) {
        this.logger.warn(`No benchmark found for user ${userId}`);
        throw new NotFoundException("No benchmark found");
      }

      this.logger.log(`Benchmark deleted for user ${userId}`);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to delete benchmark for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        "Failed to delete benchmark. Please try again later.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  /**
   * Helper method to populate coin info (name, symbol, image) from CryptoService
   */
  private async populateCoinInfo(
    holdings: PortfolioHolding[],
  ): Promise<PortfolioHolding[]> {
    if (holdings.length === 0) {
      return holdings;
    }

    try {
      const coinIds = holdings.map((h) => h.coinId);
      const coinsInfo = await this.cryptoService.getCoinsBasicInfo(coinIds);

      return holdings.map((holding) => {
        const coinInfo = coinsInfo[holding.coinId];
        const holdingObj = holding.toObject();

        if (coinInfo) {
          return {
            ...holdingObj,
            coinName: coinInfo.name,
            coinSymbol: coinInfo.symbol,
            coinImage: coinInfo.image,
          } as PortfolioHolding;
        }

        return holdingObj as PortfolioHolding;
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to populate coin info for holdings: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      this.logger.warn(
        "Returning holdings without coin info due to API failure",
      );
      return holdings.map((holding) => holding.toObject() as PortfolioHolding);
    }
  }

  /**
   * Fetch price histories for all unique coins in the portfolio
   */
  private async fetchPriceHistories(
    coinIds: string[],
    days: number,
  ): Promise<
    Array<{
      coinId: string;
      prices: Array<{ timestamp: number; price: number }>;
    }>
  > {
    const uniqueCoinIds = [...new Set(coinIds)];
    const priceHistories: Array<{
      coinId: string;
      prices: Array<{ timestamp: number; price: number }>;
    }> = [];

    for (const coinId of uniqueCoinIds) {
      try {
        const response = await this.cryptoService.getCoinPriceHistory(
          coinId,
          days,
        );
        priceHistories.push({ coinId, prices: response.prices });
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to fetch price history for ${coinId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        priceHistories.push({ coinId, prices: [] });
      }

      if (uniqueCoinIds.indexOf(coinId) < uniqueCoinIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return priceHistories;
  }

  /**
   * Build a map of coin prices organized by timestamp
   */
  private buildPriceMap(
    priceHistories: Array<{
      coinId: string;
      prices: Array<{ timestamp: number; price: number }>;
    }>,
  ): {
    priceMap: Map<string, Map<number, number>>;
    sortedTimestamps: number[];
  } {
    const priceMap = new Map<string, Map<number, number>>();
    const allTimestamps = new Set<number>();

    priceHistories.forEach(({ coinId, prices }) => {
      const coinPriceMap = new Map<number, number>();
      prices.forEach((priceData) => {
        coinPriceMap.set(priceData.timestamp, priceData.price);
        allTimestamps.add(priceData.timestamp);
      });
      priceMap.set(coinId, coinPriceMap);
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    return { priceMap, sortedTimestamps };
  }

  /**
   * Calculate portfolio value at each timestamp
   */
  private calculatePortfolioHistory(
    holdings: PortfolioHolding[],
    priceMap: Map<string, Map<number, number>>,
    sortedTimestamps: number[],
  ): Array<{ timestamp: number; totalValue: number; date: string }> {
    return sortedTimestamps.map((timestamp) => {
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
  }
}
