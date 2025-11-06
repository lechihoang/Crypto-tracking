/**
 * Price Alert-related types
 */

// Price alert from backend
// Note: coinSymbol, coinName, coinImage are NOT stored in database
// They are populated from CoinGecko API when fetched from backend
export interface PriceAlert {
  id: string;
  userId: string;
  coinId: string; // CoinGecko ID (e.g., "bitcoin")
  coinSymbol?: string; // Populated from API (e.g., "BTC")
  coinName?: string; // Populated from API (e.g., "Bitcoin")
  coinImage?: string; // Populated from API
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  triggeredPrice?: number;
  triggeredAt?: string; // ISO timestamp
}

// Create alert request
export interface CreateAlertRequest {
  coinId: string;
  condition: 'above' | 'below';
  targetPrice: number;
}

// Update alert request
export interface UpdateAlertRequest {
  condition?: 'above' | 'below';
  targetPrice?: number;
  isActive?: boolean;
}

// Alerts API response wrapper
export interface AlertsResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
