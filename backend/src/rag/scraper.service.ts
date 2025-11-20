import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ScrapedContent } from "./dto";

@Injectable()
export class ScraperService {
  private readonly coinGeckoBaseUrl = "https://api.coingecko.com/api/v3";
  private readonly coinGeckoApiKey: string;

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

  /**
   * Fetch all cryptocurrency categories with descriptions
   * Returns ~100+ categories (DeFi, NFT, Gaming, etc.) with detailed info
   * This is VERY efficient: 1 API call = 100+ knowledge chunks!
   */
  async getCategoriesData(): Promise<ScrapedContent[]> {
    console.log(`[CoinGecko API] Fetching all categories...`);

    const content: ScrapedContent[] = [];

    try {
      interface CoinGeckoCategory {
        id?: string;
        name: string;
        market_cap?: number;
        market_cap_change_24h?: number;
        volume_24h?: number;
        top_3_coins?: string[];
      }

      const response = await axios.get<CoinGeckoCategory[]>(
        `${this.coinGeckoBaseUrl}/coins/categories`,
        {
          headers: this.getCoinGeckoHeaders(),
          timeout: 10000,
        },
      );

      const categories: CoinGeckoCategory[] = response.data;
      console.log(`[CoinGecko API] Found ${categories.length} categories`);

      for (const category of categories) {
        try {
          // Build comprehensive content about each category
          let categoryContent = `${category.name} is a cryptocurrency category`;

          if (category.market_cap) {
            categoryContent += ` with a total market capitalization of $${(category.market_cap / 1e9).toFixed(2)} billion`;
          }

          if (category.market_cap_change_24h) {
            const change = category.market_cap_change_24h > 0 ? "up" : "down";
            categoryContent += `, ${change} ${Math.abs(category.market_cap_change_24h).toFixed(2)}% in the last 24 hours`;
          }

          categoryContent += `.`;

          if (category.volume_24h) {
            categoryContent += ` The 24-hour trading volume is $${(category.volume_24h / 1e9).toFixed(2)} billion.`;
          }

          if (category.top_3_coins && category.top_3_coins.length > 0) {
            categoryContent += ` Top coins in this category include: ${category.top_3_coins.join(", ")}.`;
          }

          const categoryKnowledge = this.getCategoryKnowledge(
            category.id || category.name,
          );
          if (categoryKnowledge) {
            categoryContent += ` ${categoryKnowledge}`;
          }

          content.push({
            title: `What is ${category.name}?`,
            content: categoryContent,
            url: `https://www.coingecko.com/en/categories/${category.id || category.name.toLowerCase().replace(/\s+/g, "-")}`,
            source: "CoinGecko API - Categories",
            publishedAt: new Date(),
          });

          console.log(`[CoinGecko API] ✓ Added category: ${category.name}`);
        } catch (error: unknown) {
          console.error(
            `[CoinGecko API] Error processing category:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      console.log(
        `[CoinGecko API] Completed. ${content.length} categories added`,
      );
      return content;
    } catch (error: unknown) {
      console.error(
        "[CoinGecko API] Categories error:",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }
  }

  /**
   * Get trending coins and searches
   */
  async getTrendingData(): Promise<ScrapedContent[]> {
    const content: ScrapedContent[] = [];

    try {
      interface TrendingCoin {
        id: string;
        name: string;
        symbol: string;
        market_cap_rank?: number;
        price_btc?: number;
        data?: {
          price_change_percentage_24h?: {
            usd?: number;
          };
        };
      }

      interface TrendingResponse {
        coins?: Array<{ item: TrendingCoin }>;
      }

      const response = await axios.get<TrendingResponse>(
        `${this.coinGeckoBaseUrl}/search/trending`,
        {
          headers: this.getCoinGeckoHeaders(),
          timeout: 10000,
        },
      );

      const trending: TrendingResponse = response.data;

      if (trending.coins && trending.coins.length > 0) {
        for (const item of trending.coins) {
          const coin = item.item;

          let trendingContent = `${coin.name} (${coin.symbol}) is currently trending in the cryptocurrency market`;

          if (coin.market_cap_rank) {
            trendingContent += ` and ranks #${coin.market_cap_rank} by market capitalization`;
          }

          trendingContent += `.`;

          if (coin.price_btc) {
            trendingContent += ` Its current price is ${coin.price_btc.toFixed(8)} BTC.`;
          }

          if (coin.data?.price_change_percentage_24h) {
            const change = coin.data.price_change_percentage_24h.usd || 0;
            const direction = change > 0 ? "increased" : "decreased";
            trendingContent += ` The price has ${direction} by ${Math.abs(change).toFixed(2)}% in the last 24 hours.`;
          }

          content.push({
            title: `${coin.name} - Trending Cryptocurrency`,
            content: trendingContent,
            url: `https://www.coingecko.com/en/coins/${coin.id}`,
            source: "CoinGecko API - Trending",
            publishedAt: new Date(),
          });
        }
      }

      return content;
    } catch (error: unknown) {
      return [];
    }
  }

  /**
   * Get global cryptocurrency market data
   */
  async getGlobalData(): Promise<ScrapedContent[]> {
    const content: ScrapedContent[] = [];

    try {
      interface GlobalData {
        total_market_cap: { usd: number };
        market_cap_change_percentage_24h_usd?: number;
        total_volume?: { usd: number };
        active_cryptocurrencies?: number;
        markets?: number;
        market_cap_percentage?: Record<string, number>;
        defi_market_cap?: number;
        defi_volume_24h?: number;
        defi_to_total_market_cap?: number;
      }

      const response = await axios.get<{ data: GlobalData }>(
        `${this.coinGeckoBaseUrl}/global`,
        {
          headers: this.getCoinGeckoHeaders(),
          timeout: 10000,
        },
      );

      const globalData: GlobalData = response.data.data;

      // Overall market overview
      let marketOverview = `The global cryptocurrency market capitalization is $${(globalData.total_market_cap.usd / 1e12).toFixed(2)} trillion`;

      if (globalData.market_cap_change_percentage_24h_usd) {
        const change = globalData.market_cap_change_percentage_24h_usd;
        const direction = change > 0 ? "up" : "down";
        marketOverview += `, ${direction} ${Math.abs(change).toFixed(2)}% in the last 24 hours`;
      }

      marketOverview += `.`;

      if (globalData.total_volume?.usd) {
        marketOverview += ` The total 24-hour trading volume is $${(globalData.total_volume.usd / 1e9).toFixed(2)} billion.`;
      }

      if (globalData.active_cryptocurrencies) {
        marketOverview += ` There are currently ${globalData.active_cryptocurrencies.toLocaleString()} active cryptocurrencies`;
      }

      if (globalData.markets) {
        marketOverview += ` trading across ${globalData.markets.toLocaleString()} markets.`;
      }

      content.push({
        title: "Global Cryptocurrency Market Overview",
        content: marketOverview,
        url: "https://www.coingecko.com/en/global-charts",
        source: "CoinGecko API - Global",
        publishedAt: new Date(),
      });

      // Market dominance
      if (globalData.market_cap_percentage) {
        let dominanceContent = `Market dominance shows the distribution of market capitalization across cryptocurrencies. `;

        const topDominance = Object.entries(globalData.market_cap_percentage)
          .slice(0, 5)
          .map(
            ([symbol, percentage]) =>
              `${symbol.toUpperCase()}: ${percentage.toFixed(2)}%`,
          )
          .join(", ");

        dominanceContent += `Currently, the top cryptocurrencies by market dominance are: ${topDominance}.`;

        content.push({
          title: "Cryptocurrency Market Dominance",
          content: dominanceContent,
          url: "https://www.coingecko.com/en/global-charts",
          source: "CoinGecko API - Global",
          publishedAt: new Date(),
        });
      }

      // DeFi data
      if (globalData.defi_market_cap || globalData.defi_volume_24h) {
        let defiContent = `DeFi (Decentralized Finance) is a major sector in the cryptocurrency ecosystem.`;

        if (globalData.defi_market_cap) {
          defiContent += ` The total DeFi market capitalization is $${(globalData.defi_market_cap / 1e9).toFixed(2)} billion`;
        }

        if (globalData.defi_to_total_market_cap) {
          defiContent += `, representing ${(globalData.defi_to_total_market_cap * 100).toFixed(2)}% of the total crypto market`;
        }

        defiContent += `.`;

        if (globalData.defi_volume_24h) {
          defiContent += ` The 24-hour DeFi trading volume is $${(globalData.defi_volume_24h / 1e9).toFixed(2)} billion.`;
        }

        defiContent += ` DeFi platforms enable financial services like lending, borrowing, and trading without traditional intermediaries.`;

        content.push({
          title: "DeFi Market Overview",
          content: defiContent,
          url: "https://www.coingecko.com/en/defi",
          source: "CoinGecko API - Global",
          publishedAt: new Date(),
        });
      }

      return content;
    } catch (error: unknown) {
      return [];
    }
  }

  /**
   * Get top 100 cryptocurrencies by market cap
   */
  async getTopCoinsData(): Promise<ScrapedContent[]> {
    const content: ScrapedContent[] = [];

    try {
      interface CoinMarketData {
        id: string;
        symbol: string;
        name: string;
        current_price: number | null;
        market_cap: number | null;
        market_cap_rank: number | null;
        total_volume: number | null;
        price_change_percentage_24h: number | null;
      }

      const response = await axios.get<CoinMarketData[]>(
        `${this.coinGeckoBaseUrl}/coins/markets`,
        {
          headers: this.getCoinGeckoHeaders(),
          params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: 100,
            page: 1,
            sparkline: false,
          },
          timeout: 10000,
        },
      );

      const coins: CoinMarketData[] = response.data;

      for (const coin of coins) {
        try {
          if (coin.current_price === null) {
            continue;
          }
          let coinContent = `${coin.name} (${coin.symbol.toUpperCase()})`;

          if (coin.market_cap_rank) {
            coinContent += ` is currently ranked #${coin.market_cap_rank} by market capitalization`;
          }

          if (coin.market_cap) {
            coinContent += ` at ${this.formatCurrency(coin.market_cap)}`;
          }

          coinContent += `.`;

          coinContent += ` The current price is ${this.formatCurrency(coin.current_price)}`;

          if (coin.price_change_percentage_24h !== null) {
            coinContent += `, ${this.formatPriceChange(coin.price_change_percentage_24h)} in the last 24 hours`;
          }

          coinContent += `.`;

          if (coin.total_volume) {
            coinContent += ` The 24-hour trading volume is ${this.formatCurrency(coin.total_volume)}.`;
          }

          content.push({
            title: `${coin.name} (${coin.symbol.toUpperCase()}) - Market Data`,
            content: coinContent,
            url: `https://www.coingecko.com/en/coins/${coin.id}`,
            source: "CoinGecko API - Markets",
            publishedAt: new Date(),
          });
        } catch (error: unknown) {
          // Skip failed coins
        }
      }

      return content;
    } catch (error: unknown) {
      return [];
    }
  }

  /**
   * Get all CoinGecko data at once
   */
  async getAllCoinGeckoData(): Promise<ScrapedContent[]> {
    const allContent: ScrapedContent[] = [];

    try {
      const [categories, trending, topCoins, global] = await Promise.all([
        this.getCategoriesData(),
        this.getTrendingData(),
        this.getTopCoinsData(),
        this.getGlobalData(),
      ]);

      allContent.push(...categories);
      allContent.push(...trending);
      allContent.push(...topCoins);
      allContent.push(...global);

      return allContent;
    } catch (error: unknown) {
      return allContent;
    }
  }

  /**
   * Helper: Format currency values into human-readable format
   */
  private formatCurrency(value: number): string {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)} billion`;
    }
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)} million`;
    }
    if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)} thousand`;
    }
    return `$${value.toFixed(2)}`;
  }

  /**
   * Helper: Format price change percentage into human-readable format
   */
  private formatPriceChange(change: number): string {
    const direction = change >= 0 ? "up" : "down";
    return `${direction} ${Math.abs(change).toFixed(2)}%`;
  }

  /**
   * Helper: Add educational context about categories
   */
  private getCategoryKnowledge(categoryId: string): string {
    const knowledge: Record<string, string> = {
      "decentralized-finance-defi":
        "DeFi enables financial services like lending, borrowing, and trading without traditional banks or intermediaries using smart contracts.",
      "smart-contract-platform":
        "Smart contract platforms allow developers to build decentralized applications (dApps) that execute automatically when conditions are met.",
      "layer-1":
        "Layer 1 blockchains are base-level networks that process and finalize transactions on their own blockchain, like Bitcoin and Ethereum.",
      "layer-2":
        "Layer 2 solutions are built on top of Layer 1 blockchains to improve scalability and reduce transaction costs.",
      nft: "NFTs (Non-Fungible Tokens) are unique digital assets that represent ownership of specific items like art, collectibles, or virtual real estate.",
      gaming:
        "Crypto gaming combines blockchain technology with video games, allowing players to truly own in-game assets and earn cryptocurrencies.",
      metaverse:
        "The metaverse refers to virtual worlds where users can interact, socialize, and conduct business using cryptocurrencies and NFTs.",
      meme: "Meme coins are cryptocurrencies inspired by internet memes or jokes, often driven by community enthusiasm and social media trends.",
      "exchange-based-tokens":
        "Exchange tokens are cryptocurrencies issued by crypto exchanges, often providing benefits like reduced trading fees.",
      stablecoins:
        "Stablecoins are cryptocurrencies designed to maintain a stable value by being pegged to assets like the US dollar.",
    };

    return knowledge[categoryId] || "";
  }
}
