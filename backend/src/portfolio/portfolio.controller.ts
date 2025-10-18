import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  UsePipes,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { PortfolioService } from "./portfolio.service";
import { AuthService } from "../auth/auth.service";
import { CreateHoldingDto } from "./dto/create-holding.dto";
import { UpdateHoldingDto } from "./dto/update-holding.dto";

@Controller("portfolio")
export class PortfolioController {
  constructor(
    private portfolioService: PortfolioService,
    private authService: AuthService,
  ) {}

  private async getUserFromToken(authHeader: string): Promise<string> {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await this.authService.getUser(token);
    return user.id;
  }

  @Get("holdings")
  async getHoldings(@Headers("authorization") authHeader: string) {
    const userId = await this.getUserFromToken(authHeader);
    return this.portfolioService.getHoldings(userId);
  }

  @Post("holdings")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async addHolding(
    @Headers("authorization") authHeader: string,
    @Body() createHoldingDto: CreateHoldingDto,
  ) {
    const userId = await this.getUserFromToken(authHeader);
    return this.portfolioService.addHolding(userId, createHoldingDto);
  }

  @Put("holdings/:id")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateHolding(
    @Headers("authorization") authHeader: string,
    @Param("id") holdingId: string,
    @Body() updateHoldingDto: UpdateHoldingDto,
  ) {
    const userId = await this.getUserFromToken(authHeader);
    return this.portfolioService.updateHolding(
      userId,
      holdingId,
      updateHoldingDto,
    );
  }

  @Delete("holdings/:id")
  async removeHolding(
    @Headers("authorization") authHeader: string,
    @Param("id") holdingId: string,
  ) {
    const userId = await this.getUserFromToken(authHeader);
    await this.portfolioService.removeHolding(userId, holdingId);
    return { message: "Holding removed successfully" };
  }

  @Get("value")
  async getPortfolioValue(@Headers("authorization") authHeader: string) {
    const userId = await this.getUserFromToken(authHeader);
    return this.portfolioService.getPortfolioValue(userId);
  }

  @Post("snapshot")
  async createSnapshot(@Headers("authorization") authHeader: string) {
    const userId = await this.getUserFromToken(authHeader);
    const { totalValue } =
      await this.portfolioService.getPortfolioValue(userId);
    return this.portfolioService.createSnapshot(userId, totalValue);
  }

  @Get("history")
  async getPortfolioHistory(
    @Headers("authorization") authHeader: string,
    @Query("days") days?: string,
  ) {
    const userId = await this.getUserFromToken(authHeader);
    const numDays = days ? parseInt(days, 10) : 30;
    return this.portfolioService.getPortfolioHistory(userId, numDays);
  }

  @Get("value-history")
  async getPortfolioValueHistory(
    @Headers("authorization") authHeader: string,
    @Query("days") days?: string,
  ) {
    const userId = await this.getUserFromToken(authHeader);
    const numDays = days ? parseInt(days, 10) : 7;
    return this.portfolioService.getPortfolioValueHistory(userId, numDays);
  }

  @Post("benchmark")
  async setBenchmark(
    @Headers("authorization") authHeader: string,
    @Body("benchmarkValue") benchmarkValue: number,
  ) {
    const userId = await this.getUserFromToken(authHeader);
    return this.portfolioService.setBenchmark(userId, benchmarkValue);
  }

  @Get("benchmark")
  async getBenchmark(@Headers("authorization") authHeader: string) {
    const userId = await this.getUserFromToken(authHeader);
    const benchmark = await this.portfolioService.getBenchmark(userId);

    // Also return current portfolio value for comparison
    const { totalValue } =
      await this.portfolioService.getPortfolioValue(userId);

    if (!benchmark) {
      return {
        benchmark: null,
        currentValue: totalValue,
        profitLoss: 0,
        profitLossPercentage: 0,
      };
    }

    const profitLoss = totalValue - Number(benchmark.benchmarkValue);
    const profitLossPercentage =
      Number(benchmark.benchmarkValue) > 0
        ? (profitLoss / Number(benchmark.benchmarkValue)) * 100
        : 0;

    return {
      benchmark: {
        value: Number(benchmark.benchmarkValue),
        setAt: benchmark.updatedAt,
      },
      currentValue: totalValue,
      profitLoss,
      profitLossPercentage,
    };
  }

  @Delete("benchmark")
  async deleteBenchmark(@Headers("authorization") authHeader: string) {
    const userId = await this.getUserFromToken(authHeader);
    await this.portfolioService.deleteBenchmark(userId);
    return { message: "Benchmark deleted successfully" };
  }
}
