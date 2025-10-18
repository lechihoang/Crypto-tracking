import { Controller, Get, Post, Query, Body, Param } from "@nestjs/common";
import { CryptoService, CoinData } from "./crypto.service";

@Controller("crypto")
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post("prices")
  async getCoinPrices(@Body() body: { coinIds: string[] }) {
    return this.cryptoService.getCoinPrices(body.coinIds);
  }

  @Get("top")
  async getTopCoins(
    @Query("limit") limit?: string,
    @Query("page") page?: string,
  ): Promise<CoinData[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.cryptoService.getTopCoins(limitNum, pageNum);
  }

  @Get("search")
  async searchCoins(@Query("q") query: string) {
    return this.cryptoService.searchCoins(query);
  }

  @Get("news/latest")
  async getNews(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.cryptoService.getNews(limitNum);
  }

  @Get("news/vi")
  async getNewsVietnamese(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.cryptoService.getNewsVietnamese(limitNum);
  }

  @Get(":coinId/history")
  async getCoinPriceHistory(
    @Param("coinId") coinId: string,
    @Query("days") days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.cryptoService.getCoinPriceHistory(coinId, daysNum);
  }

  @Get(":coinId/market")
  async getCoinMarketData(@Param("coinId") coinId: string) {
    return this.cryptoService.getCoinMarketData(coinId);
  }

  @Get(":coinId/vi")
  async getCoinDetailsVietnamese(@Param("coinId") coinId: string) {
    return this.cryptoService.getCoinDetailsVietnamese(coinId);
  }

  @Get(":coinId")
  async getCoinDetails(@Param("coinId") coinId: string) {
    return this.cryptoService.getCoinDetails(coinId);
  }
}
