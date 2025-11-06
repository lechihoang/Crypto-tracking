/**
 * Shared types used across multiple components
 * Centralized to avoid duplication
 */

// Portfolio holding with computed value
export interface HoldingWithValue {
  id: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  coinImage?: string;
  quantity: number;
  averageBuyPrice?: number;
  notes?: string;
  currentPrice: number;
  value: number;
  currentValue: number; // Alias for value (for backward compatibility)
  profitLoss?: number;
  profitLossPercentage?: number;
}

// Simple coin info for selectors and searches
export interface Coin {
  id: string;
  name: string;
  symbol: string;
  image?: string;
}

// Alert/Notification (simplified version of PriceAlert for display)
export interface Alert {
  id: string;
  coinId: string;
  coinSymbol?: string; // Populated from API
  coinName?: string; // Populated from API
  coinImage?: string; // Populated from API
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  triggeredPrice?: number;
  triggeredAt?: string;
  createdAt: string;
  read?: boolean; // For notification read status (frontend only)
}

// Chart data point
export interface ChartDataPoint {
  date: string;
  formattedDate?: string; // Formatted date for display
  value: number;
  timestamp?: number;
}

// Price chart data
export interface PriceChartData {
  time: string;
  price: number;
  timestamp?: number;
}

// Stats for dashboard
export interface DashboardStat {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

// Message for chatbot (matches backend ChatMessage schema)
export interface ChatMessage {
  id: string;
  userId: string | null; // Nullable for anonymous users
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO timestamp (createdAt)
}
