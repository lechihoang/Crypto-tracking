/**
 * CoinGecko API Types
 * These types match the CoinGecko API v3 response format
 */

// Main cryptocurrency data from /coins/markets endpoint (CoinGecko format)
export interface CryptoCurrency {
  coinId?: string; // CoinGecko ID (e.g., "bitcoin", "ethereum")
  id: string; // CoinGecko ID - always string
  symbol: string;
  name: string;
  slug?: string; // CMC-style slug
  image?: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  cmc_rank?: number; // CMC-style rank alias
  fully_diluted_valuation?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_24h?: number;
  market_cap_change_percentage_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  roi?: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  date_added?: string;
  tags?: unknown[];
  platform?: unknown;
  num_market_pairs?: number;
  sparkline_in_7d?: {
    price: number[];
  };
  // CMC-style quote structure
  quote?: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
}

// Simple price data from /simple/price endpoint
export interface CoinPrice {
  usd: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
}

// Search result from /search endpoint
export interface SearchResult {
  coinId: string; // CoinGecko ID
  id: string; // Alias for coinId
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

// Detailed coin info from /coins/{id} endpoint
export interface CoinDetails {
  coinId: string; // CoinGecko ID
  id: string; // Alias for coinId
  name: string;
  symbol: string;
  description: {
    en: string;
    vi?: string;
  };
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
  market_data?: {
    current_price?: {
      usd?: number;
    };
    market_cap?: {
      usd?: number;
    };
    total_volume?: {
      usd?: number;
    };
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
    circulating_supply?: number;
    total_supply?: number;
    max_supply?: number;
    [key: string]: unknown;
  };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    official_forum_url?: string[];
    chat_url?: string[];
    announcement_url?: string[];
    twitter_screen_name?: string;
    facebook_username?: string;
    telegram_channel_identifier?: string;
    subreddit_url?: string;
    repos_url?: {
      github?: string[];
      bitbucket?: string[];
    };
    [key: string]: unknown;
  };
  tickers?: unknown[];
  [key: string]: unknown;
}

// Price history from /coins/{id}/market_chart endpoint
export interface PriceHistory {
  prices: Array<{
    timestamp: number;
    price: number;
    date: string;
  }>;
}

// Coin info from backend API (getCoinInfo/getCoinInfoVietnamese)
export interface CoinInfo {
  id: number;
  name: string;
  symbol: string;
  category: string;
  description: string;
  slug: string;
  logo: string;
  subreddit: string;
  notice: string;
  tags: unknown[];
  tag_names: unknown[];
  tag_groups: unknown[];
  urls: {
    website: string[];
    technical_doc: string[];
    twitter: string[];
    reddit: string[];
    message_board: string[];
    announcement: string[];
    chat: string[];
    explorer: string[];
    source_code: string[];
    facebook: string[];
  };
  platform: unknown;
  date_added: string;
  twitter_username: string;
  is_hidden: number;
  date_launched: string;
  contract_address: unknown[];
  self_reported_circulating_supply: number;
  self_reported_tags: unknown;
  self_reported_market_cap: number;
  num_market_pairs: number;
}

// News article from CryptoCompare API
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