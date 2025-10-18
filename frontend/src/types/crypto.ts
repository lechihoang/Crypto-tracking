export interface CryptoCurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  image?: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  last_updated: string;
  date_added: string;
  tags: string[];
  platform: {
    id?: number;
    name?: string;
    symbol?: string;
    slug?: string;
    token_address?: string;
  } | null;
  sparkline_in_7d?: {
    price: number[];
  };
  quote: {
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

export interface CryptoListResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string;
    elapsed: number;
    credit_count: number;
  };
  data: CryptoCurrency[];
}

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
  tags: string[];
  tag_names: string[];
  tag_groups: string[];
  urls: {
    website: string[];
    twitter: string[];
    message_board: string[];
    chat: string[];
    facebook: string[];
    explorer: string[];
    reddit: string[];
    technical_doc: string[];
    source_code: string[];
    announcement: string[];
  };
  platform: {
    id?: number;
    name?: string;
    symbol?: string;
    slug?: string;
    token_address?: string;
  } | null;
  date_added: string;
  twitter_username: string;
  is_hidden: number;
  date_launched: string;
  contract_address: Array<{
    contract_address?: string;
    platform?: {
      coin?: {
        id?: string;
        name?: string;
        symbol?: string;
      };
    };
  }>;
  self_reported_circulating_supply: number;
  self_reported_tags: string[] | null;
  self_reported_market_cap: number;
  num_market_pairs?: number;
}

export interface CoinInfoResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string;
    elapsed: number;
    credit_count: number;
  };
  data: {
    [key: string]: CoinInfo;
  };
}