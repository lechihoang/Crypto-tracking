import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import axios from "axios";

export interface CoinData {
  coinId: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

export interface CoinPrice {
  usd: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
}

export interface SearchResult {
  coinId: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

export interface CoinDetails {
  coinId: string;
  name: string;
  symbol: string;
  description: {
    en: string;
    vi?: string;
  };
  market_data?: unknown;
  tickers?: unknown[];
  [key: string]: unknown;
}

export interface PriceHistory {
  prices: Array<{
    timestamp: number;
    price: number;
    date: string;
  }>;
}

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: number;
  categories: string[];
  titleVi?: string;
  bodyVi?: string;
}

@Injectable()
export class CryptoService {
  private readonly coinGeckoAPI = "https://api.coingecko.com/api/v3";
  private readonly coinGeckoApiKey: string;
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds cache
  private requestQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    fn: () => Promise<unknown>;
  }> = [];
  private isProcessingQueue = false;
  private readonly REQUEST_DELAY = 1000; // 1 second delay between requests

  constructor() {
    // Initialize CoinGecko API key
    this.coinGeckoApiKey = process.env.COINGECKO_API_KEY || "";
  }

  /**
   * Get headers for CoinGecko API requests with authentication
   */
  private getCoinGeckoHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.coinGeckoApiKey) {
      headers["x-cg-demo-api-key"] = this.coinGeckoApiKey;
    }

    return headers;
  }

  private async queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        fn: fn as () => Promise<unknown>,
      });
      void this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { resolve, reject, fn } = this.requestQueue.shift()!;

      try {
        const result = await fn();
        resolve(result);
      } catch (error: unknown) {
        reject(error);
      }

      // Wait before processing next request
      if (this.requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.REQUEST_DELAY));
      }
    }

    this.isProcessingQueue = false;
  }

  private async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }

    try {
      const data = await this.queueRequest(fetcher);
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data as
          | { status?: { error_message?: string } }
          | undefined;
        console.warn(
          "CoinGecko API error:",
          error.response?.status,
          errorMessage?.status?.error_message,
        );

        // If rate limited, extend cache time for existing data
        if (error.response?.status === 429 && cached) {
          console.log("Rate limited, extending cache time for existing data");
          this.cache.set(key, { data: cached.data, timestamp: Date.now() });
          return cached.data as T;
        }

        // If rate limited without cache, throw proper error
        if (error.response?.status === 429) {
          throw new HttpException(
            "CoinGecko API rate limit exceeded. Please try again later.",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        // If not found
        if (error.response?.status === 404) {
          throw new HttpException(
            "Cryptocurrency not found",
            HttpStatus.NOT_FOUND,
          );
        }
      }

      // If API fails, return cached data if available
      if (cached) {
        console.log("Returning cached data due to API failure");
        return cached.data as T;
      }

      // No cache available, throw service unavailable
      throw new HttpException(
        "Failed to fetch cryptocurrency data. Please try again later.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<Record<string, CoinPrice>> {
    const cacheKey = `prices_${coinIds.join(",")}`;
    return this.getCachedData<Record<string, CoinPrice>>(cacheKey, async () => {
      const response = await axios.get<Record<string, CoinPrice>>(
        `${this.coinGeckoAPI}/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
        { headers: this.getCoinGeckoHeaders() },
      );
      return response.data;
    });
  }

  async getTopCoins(limit: number = 10, page: number = 1): Promise<CoinData[]> {
    const cacheKey = `top_coins_${limit}_page_${page}`;
    return this.getCachedData<CoinData[]>(cacheKey, async () => {
      const response = await axios.get<
        Array<{ id: string; [key: string]: any }>
      >(
        `${this.coinGeckoAPI}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=${page}&price_change_percentage=1h,24h,7d&sparkline=true`,
        { headers: this.getCoinGeckoHeaders() },
      );
      return response.data.map(
        (coin) => ({ ...coin, coinId: coin.id }) as unknown as CoinData,
      );
    });
  }

  async searchCoins(query: string): Promise<SearchResult[]> {
    const cacheKey = `search_${query}`;
    return this.getCachedData<SearchResult[]>(cacheKey, async () => {
      const response = await axios.get<{
        coins: Array<{ id: string; [key: string]: any }>;
      }>(`${this.coinGeckoAPI}/search?query=${query}`, {
        headers: this.getCoinGeckoHeaders(),
      });
      return response.data.coins
        .slice(0, 10)
        .map(
          (coin) => ({ ...coin, coinId: coin.id }) as unknown as SearchResult,
        );
    });
  }

  async getCoinDetails(coinId: string): Promise<CoinDetails> {
    const cacheKey = `details_${coinId}`;
    return this.getCachedData<CoinDetails>(cacheKey, async () => {
      const response = await axios.get<{ id: string; [key: string]: any }>(
        `${this.coinGeckoAPI}/coins/${coinId}?localization=false&tickers=true&community_data=false&developer_data=false`,
        { headers: this.getCoinGeckoHeaders() },
      );
      return {
        ...response.data,
        coinId: response.data.id,
      } as unknown as CoinDetails;
    });
  }

  async getCoinMarketData(coinId: string): Promise<CoinData | null> {
    const cacheKey = `market_data_${coinId}`;
    return this.getCachedData<CoinData | null>(cacheKey, async () => {
      const response = await axios.get<
        Array<{ id: string; [key: string]: any }>
      >(
        `${this.coinGeckoAPI}/coins/markets?vs_currency=usd&ids=${coinId}&price_change_percentage=1h,24h,7d,30d`,
        { headers: this.getCoinGeckoHeaders() },
      );
      // Returns an array, we want the first item
      const coin = response.data[0];
      return coin
        ? ({ ...coin, coinId: coin.id } as unknown as CoinData)
        : null;
    });
  }

  /**
   * Get basic info (name, symbol, image) for multiple coins at once
   * This is optimized for portfolio holdings display
   */
  async getCoinsBasicInfo(coinIds: string[]): Promise<
    Record<
      string,
      {
        name: string;
        symbol: string;
        image: string;
      }
    >
  > {
    if (coinIds.length === 0) {
      return {};
    }

    const cacheKey = `basic_info_${coinIds.sort().join(",")}`;
    return this.getCachedData<
      Record<string, { name: string; symbol: string; image: string }>
    >(cacheKey, async () => {
      const response = await axios.get<
        Array<{
          id: string;
          name: string;
          symbol: string;
          image: string;
          [key: string]: any;
        }>
      >(
        `${this.coinGeckoAPI}/coins/markets?vs_currency=usd&ids=${coinIds.join(",")}&per_page=${coinIds.length}`,
        { headers: this.getCoinGeckoHeaders() },
      );

      // Convert array to record for easy lookup
      const result: Record<
        string,
        { name: string; symbol: string; image: string }
      > = {};
      response.data.forEach((coin) => {
        result[coin.id] = {
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
        };
      });

      return result;
    });
  }

  async getCoinPriceHistory(
    coinId: string,
    days: number = 7,
  ): Promise<PriceHistory> {
    const cacheKey = `history_${coinId}_${days}`;
    return this.getCachedData<PriceHistory>(cacheKey, async () => {
      const response = await axios.get<{ prices: Array<[number, number]> }>(
        `${this.coinGeckoAPI}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
        { headers: this.getCoinGeckoHeaders() },
      );

      // Transform the data to a more frontend-friendly format
      const prices = response.data.prices.map(
        ([timestamp, price]: [number, number]) => ({
          timestamp,
          price,
          date: new Date(timestamp).toISOString(),
        }),
      );

      return { prices };
    });
  }

  /**
   * Get latest crypto news from CryptoCompare
   */
  async getNews(limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `crypto_news_${limit}`;
    return this.getCachedData<NewsArticle[]>(cacheKey, async () => {
      try {
        interface CryptoCompareArticle {
          id: string;
          title: string;
          body: string;
          url: string;
          imageurl: string;
          source: string;
          published_on: number;
          categories?: string;
        }

        const response = await axios.get<{ Data: CryptoCompareArticle[] }>(
          `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest`,
        );

        return response.data.Data.slice(0, limit).map((article) => ({
          id: article.id,
          title: article.title,
          body: article.body,
          url: article.url,
          imageUrl: article.imageurl,
          source: article.source,
          publishedAt: article.published_on * 1000, // Convert to milliseconds
          categories: article.categories?.split("|") || [],
        }));
      } catch (error: unknown) {
        console.error("Failed to fetch crypto news:", error);
        return [];
      }
    });
  }
}
