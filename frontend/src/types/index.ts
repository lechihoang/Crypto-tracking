/**
 * Central export point for all TypeScript types
 */

// CoinGecko API types
export type {
  CryptoCurrency,
  CoinPrice,
  SearchResult,
  CoinDetails,
  CoinInfo,
  PriceHistory,
  NewsArticle,
} from './crypto';

// Shared common types
export type {
  HoldingWithValue,
  Coin,
  Alert,
  ChartDataPoint,
  PriceChartData,
  DashboardStat,
  ChatMessage,
} from './common';

// Auth types
export type {
  User,
  AuthContextType,
  SignInRequest,
  SignUpRequest,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  ChangePasswordRequest,
  AuthResponse,
} from './auth';

// Portfolio types
export type {
  PortfolioHolding,
  CreateHoldingRequest,
  UpdateHoldingRequest,
  PortfolioValue,
  PortfolioSnapshot,
  PortfolioResponse,
} from './portfolio';

// Alert types
export type {
  PriceAlert,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertsResponse,
} from './alerts';
