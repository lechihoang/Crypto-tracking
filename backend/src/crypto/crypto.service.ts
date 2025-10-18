import { Injectable } from "@nestjs/common";
import axios from "axios";
import { Translate } from "@google-cloud/translate/build/src/v2";

export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

@Injectable()
export class CryptoService {
  private readonly coinGeckoAPI = "https://api.coingecko.com/api/v3";
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 300000; // 5 minute cache (increased)
  private requestQueue: Array<{
    resolve: Function;
    reject: Function;
    fn: Function;
  }> = [];
  private isProcessingQueue = false;
  private readonly REQUEST_DELAY = 1000; // 1 second delay between requests
  private translateClient: Translate;

  // Mapping between numeric IDs (from UI) and CoinGecko string IDs
  private readonly coinIdMapping: Record<number, string> = {
    1: "bitcoin",
    2: "ethereum",
    3: "tether",
    4: "binancecoin",
    5: "solana",
    6: "usd-coin",
    7: "xrp",
    8: "staked-ether",
    9: "cardano",
    10: "dogecoin",
  };

  constructor() {
    // Initialize Google Cloud Translate client
    // API key will be set via environment variable GOOGLE_TRANSLATE_API_KEY
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.translateClient = new Translate({
      key: apiKey,
    });
  }

  private async queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, fn });
      this.processQueue();
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
      } catch (error) {
        reject(error);
      }

      // Wait before processing next request
      if (this.requestQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.REQUEST_DELAY));
      }
    }

    this.isProcessingQueue = false;
  }

  private async getCachedData(key: string, fetcher: () => Promise<any>) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const data = await this.queueRequest(fetcher);
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.warn(
        "CoinGecko API error:",
        error.response?.status,
        error.response?.data?.status?.error_message,
      );

      // If rate limited, extend cache time for existing data
      if (error.response?.status === 429 && cached) {
        console.log("Rate limited, extending cache time for existing data");
        this.cache.set(key, { data: cached.data, timestamp: Date.now() });
        return cached.data;
      }

      // If API fails, return cached data if available
      if (cached) {
        console.log("Returning cached data due to API failure");
        return cached.data;
      }

      throw error;
    }
  }

  async getCoinPrices(coinIds: string[]) {
    const cacheKey = `prices_${coinIds.join(",")}`;
    return this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      );
      return response.data;
    });
  }

  async getTopCoins(limit: number = 10, page: number = 1): Promise<CoinData[]> {
    const cacheKey = `top_coins_${limit}_page_${page}`;
    return this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=${page}&price_change_percentage=1h,24h,7d&sparkline=true`,
      );
      return response.data;
    });
  }

  async searchCoins(query: string) {
    const cacheKey = `search_${query}`;
    return this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/search?query=${query}`,
      );
      return response.data.coins.slice(0, 10);
    });
  }

  async getCoinDetails(coinId: string) {
    const cacheKey = `details_${coinId}`;
    return this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/coins/${coinId}?localization=false&tickers=true&community_data=false&developer_data=false`,
      );
      return response.data;
    });
  }

  async getCoinMarketData(coinId: string) {
    const cacheKey = `market_data_${coinId}`;
    return this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/coins/markets?vs_currency=usd&ids=${coinId}&price_change_percentage=1h,24h,7d,30d`,
      );
      // Returns an array, we want the first item
      return response.data[0] || null;
    });
  }

  async getCoinPriceHistory(coinId: string, days: number = 7) {
    const cacheKey = `history_${coinId}_${days}`;
    return this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
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
   * Get current prices for multiple coins by numeric IDs
   * @param coinIds Array of numeric coin IDs
   * @returns Map of coinId to current price
   */
  async getCurrentPrices(coinIds: number[]): Promise<Record<number, number>> {
    const result: Record<number, number> = {};

    // Convert numeric IDs to CoinGecko IDs
    const coinGeckoIds: string[] = [];
    const idMapping: Record<string, number> = {};

    for (const numericId of coinIds) {
      const geckoId = this.coinIdMapping[numericId];
      if (geckoId) {
        coinGeckoIds.push(geckoId);
        idMapping[geckoId] = numericId;
      }
    }

    if (coinGeckoIds.length === 0) {
      return result;
    }

    // Fetch prices from CoinGecko
    const cacheKey = `current_prices_${coinGeckoIds.join(",")}`;
    const prices = await this.getCachedData(cacheKey, async () => {
      const response = await axios.get(
        `${this.coinGeckoAPI}/simple/price?ids=${coinGeckoIds.join(",")}&vs_currencies=usd`,
      );
      return response.data;
    });

    // Map back to numeric IDs
    for (const [geckoId, priceData] of Object.entries(prices)) {
      const numericId = idMapping[geckoId];
      if (numericId && priceData && typeof priceData === "object") {
        result[numericId] = (priceData as any).usd;
      }
    }

    return result;
  }

  /**
   * Get latest crypto news from CryptoCompare
   */
  async getNews(limit: number = 10): Promise<any[]> {
    const cacheKey = `crypto_news_${limit}`;
    return this.getCachedData(cacheKey, async () => {
      try {
        const response = await axios.get(
          `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest`,
        );

        // Return limited number of articles
        return response.data.Data.slice(0, limit).map((article: any) => ({
          id: article.id,
          title: article.title,
          body: article.body,
          url: article.url,
          imageUrl: article.imageurl,
          source: article.source,
          publishedAt: article.published_on * 1000, // Convert to milliseconds
          categories: article.categories?.split('|') || [],
        }));
      } catch (error) {
        console.error('Failed to fetch crypto news:', error);
        return [];
      }
    });
  }

  /**
   * Translate coin description from English to Vietnamese using Google Cloud Translation API
   */
  async translateDescription(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    try {
      // Google Cloud Translate API
      const [translation] = await this.translateClient.translate(text, 'vi');
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text if translation fails
      return text;
    }
  }

  /**
   * Get coin details with translated description
   */
  async getCoinDetailsVietnamese(coinId: string) {
    const coinDetails = await this.getCoinDetails(coinId);

    if (coinDetails?.description?.en) {
      try {
        coinDetails.description.vi = await this.translateDescription(coinDetails.description.en);
      } catch (error) {
        console.error('Failed to translate description:', error);
        coinDetails.description.vi = coinDetails.description.en;
      }
    }

    return coinDetails;
  }

  /**
   * Get latest crypto news with Vietnamese translation
   */
  async getNewsVietnamese(limit: number = 10): Promise<any[]> {
    const news = await this.getNews(limit);

    // Translate title and body for each news article
    const translatedNews = await Promise.all(
      news.map(async (article) => {
        try {
          const [translatedTitle, translatedBody] = await Promise.all([
            this.translateDescription(article.title),
            this.translateDescription(article.body.slice(0, 500)), // Translate first 500 chars for performance
          ]);

          return {
            ...article,
            titleVi: translatedTitle,
            bodyVi: translatedBody,
          };
        } catch (error) {
          console.error('Failed to translate news article:', error);
          return {
            ...article,
            titleVi: article.title,
            bodyVi: article.body,
          };
        }
      })
    );

    return translatedNews;
  }
}
