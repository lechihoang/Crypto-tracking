'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { clientApi } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';
import { PriceChartData } from '@/types';

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  coinId?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({ symbol, currentPrice, coinId }) => {
  const [timeframe, setTimeframe] = useState('7d');
  const [data, setData] = useState<PriceChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDaysFromTimeframe = (tf: string): number => {
    switch (tf) {
      case '1d': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 7;
    }
  };

  const formatTimeDisplay = (timestamp: number, timeframe: string): string => {
    const date = new Date(timestamp);
    if (timeframe === '1d') {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '7d') {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    }
  };

  const fetchPriceHistory = async (tf: string) => {
    if (!coinId) {
      generateMockData(tf);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const days = getDaysFromTimeframe(tf);
      const response = await clientApi.getCoinPriceHistory(coinId, days);

      if (response?.prices) {
        const PricechartData: PriceChartData[] = response.prices.map((item: { timestamp: number; price: number }) => ({
          time: formatTimeDisplay(item.timestamp, tf),
          price: item.price,
          timestamp: item.timestamp,
        }));
        setData(PricechartData);
      } else {
        generateMockData(tf);
      }
    } catch (err) {
      console.error('Failed to fetch price history:', err);
      setError('Không thể tải dữ liệu biểu đồ');
      generateMockData(tf);
    } finally {
      setLoading(false);
    }
  };

  // Fallback to mock data when real API fails
  const generateMockData = (tf: string) => {
    const days = getDaysFromTimeframe(tf);
    const mockData: PriceChartData[] = [];
    const now = new Date().getTime();
    const basePrice = currentPrice;

    const interval = tf === '1d' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour for 1d, 1 day for others
    const points = tf === '1d' ? 24 : days;

    for (let i = points; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const variation = (Math.random() - 0.5) * 0.1;
      const price = basePrice * (1 + variation * Math.sin(i / 10));

      mockData.push({
        time: formatTimeDisplay(timestamp, tf),
        price: Math.max(0, price),
        timestamp,
      });
    }
    setData(mockData);
    setLoading(false);
  };

  useEffect(() => {
    fetchPriceHistory(timeframe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, coinId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="h-80">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const minPrice = data.length > 0 ? Math.min(...data.map(d => d.price)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.price)) : 0;
  const priceChange = data.length > 1 ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : 0;
  const isPositive = priceChange >= 0;

  const formatPrice = (value: number) => {
    if (value < 0.01) return `$${value.toFixed(6)}`;
    if (value < 1) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-gray-600">{`Date: ${label}`}</p>
          <p className="text-blue-600 font-semibold">
            {`Price: ${formatPrice(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {['1d', '7d', '30d', '90d', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              disabled={loading}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold">{symbol} Biểu đồ giá</h3>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <span className="font-medium">
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">({timeframe})</span>
          </div>
          {error && (
            <div className="text-orange-600 text-sm">
              {error} (hiển thị dữ liệu mô phỏng)
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              domain={[minPrice * 0.95, maxPrice * 1.05]}
              tickFormatter={formatPrice}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: isPositive ? '#10b981' : '#ef4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;