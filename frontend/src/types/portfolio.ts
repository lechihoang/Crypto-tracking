/**
 * Portfolio-related types
 */

// Portfolio holding from backend
// Note: coinSymbol, coinName, coinImage are NOT stored in database
// They are populated from CoinGecko API when fetched from backend
export interface PortfolioHolding {
  id: string;
  userId: string;
  coinId: string; // CoinGecko ID (e.g., "bitcoin")
  coinSymbol: string; // Populated from API (e.g., "BTC")
  coinName: string; // Populated from API (e.g., "Bitcoin")
  coinImage?: string; // Populated from API
  quantity: number;
  averageBuyPrice?: number;
  notes?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Create holding request
// Note: coinSymbol, coinName, coinImage are only for validation/display
// They are NOT stored in database
export interface CreateHoldingRequest {
  coinId: string; // CoinGecko ID (required)
  coinSymbol: string; // For display only
  coinName: string; // For display only
  coinImage?: string; // For display only
  quantity: number;
  averageBuyPrice?: number;
  notes?: string;
}

// Update holding request
export interface UpdateHoldingRequest {
  quantity?: number;
  averageBuyPrice?: number;
  notes?: string;
}

// Portfolio value response
export interface PortfolioValue {
  totalValue: number;
  holdings: Array<{
    holding: PortfolioHolding;
    currentPrice: number;
    currentValue: number;
    profitLoss?: number;
    profitLossPercentage?: number;
  }>;
}

// Portfolio snapshot
export interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalValue: number;
  snapshotDate: string;
  createdAt: string;
}

// Portfolio API response wrapper
export interface PortfolioResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
