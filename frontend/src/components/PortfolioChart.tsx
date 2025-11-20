'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { portfolioApi } from '@/lib/api';
import { TrendingUp } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { ChartDataPoint } from '@/types';
import { Card } from '@/components/ui/card';
const PortfolioChart = React.memo(function PortfolioChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchPortfolioHistory();
  }, [timeRange]);

  const fetchPortfolioHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await portfolioApi.getPortfolioValueHistory(timeRange);

      if (result.error) {
        // Check if it's a rate limit error
        if (result.error.includes('Too Many Requests') || result.error.includes('429')) {
          setError('API bị giới hạn tốc độ. Vui lòng đợi 1-2 phút và thử lại.');
        } else {
          setError(result.error);
        }
      } else if (result.data && Array.isArray(result.data)) {
        const history = result.data as unknown as Array<{ timestamp: number; totalValue: number; date: string }>;
        const processedData = history.map((dataPoint) => ({
          date: dataPoint.date,
          value: Number(dataPoint.totalValue),
          formattedDate: new Date(dataPoint.timestamp).toLocaleDateString('vi-VN'),
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setChartData(processedData);
        setError(''); // Clear any previous errors
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 429) {
        setError('API bị giới hạn tốc độ. Vui lòng đợi 1-2 phút và thử lại.');
      } else {
        setError('Không thể tải lịch sử giá trị portfolio');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatCurrencyDetailed = useCallback((value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  }, []);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: ChartDataPoint;
    }>;
  }

  const CustomTooltip = useCallback(({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#23242a] p-3 border border-gray-600/50 rounded-lg shadow-lg">
          <p className="text-sm text-gray-100">{payload[0].payload.formattedDate}</p>
          <p className="text-lg font-semibold text-primary-500">
            {formatCurrencyDetailed(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  }, [formatCurrencyDetailed]);

  const changeInfo = useMemo(() => {
    if (chartData.length < 2) return { change: 0, percentage: 0, isPositive: true };

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const change = lastValue - firstValue;
    const percentage = firstValue > 0 ? (change / firstValue) * 100 : 0;

    return {
      change,
      percentage,
      isPositive: change >= 0,
    };
  }, [chartData]);

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow p-6">
        <div className="h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover:shadow-lg transition-shadow p-6">
        <div className="text-center py-8">
          <p className="text-danger-400 mb-4">{error}</p>
          <button
            onClick={fetchPortfolioHistory}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow p-6">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-100 hover:bg-gray-600 border border-gray-600/50'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-white">Biểu đồ giá trị portfolio</h3>
          {chartData.length >= 2 && (
            <div className={`flex items-center gap-1 ${
              changeInfo.isPositive ? 'text-success-500' : 'text-danger-500'
            }`}>
              <span className="font-medium">
                {changeInfo.isPositive ? '+' : ''}{changeInfo.percentage.toFixed(2)}%
              </span>
              <span className="text-sm text-gray-100">({timeRange}d)</span>
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-100 mb-4">
            Chưa có dữ liệu lịch sử portfolio
          </p>
          <p className="text-sm text-gray-100">
            Dữ liệu sẽ được thu thập khi bạn thêm coin vào danh mục
          </p>
        </div>
      ) : chartData.length === 1 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-lg font-semibold text-white mb-2">
            {formatCurrency(chartData[0].value)}
          </p>
          <p className="text-gray-100 mb-4">
            Giá trị portfolio hiện tại
          </p>
          <p className="text-sm text-gray-100">
            Biểu đồ sẽ hiển thị khi có nhiều điểm dữ liệu theo thời gian
          </p>
        </div>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B2F36" opacity={0.3} />
              <XAxis
                dataKey="formattedDate"
                stroke="#B0B3BB"
                fontSize={12}
                tick={{ fill: '#B0B3BB' }}
              />
              <YAxis
                domain={(() => {
                  if (chartData.length === 0) return ['auto', 'auto'];
                  const values = chartData.map(d => d.value);
                  const minValue = Math.min(...values);
                  const maxValue = Math.max(...values);
                  const padding = (maxValue - minValue) * 0.05; // 5% padding
                  return [
                    Math.max(0, minValue - padding), // Don't go below 0
                    maxValue + padding
                  ];
                })()}
                stroke="#B0B3BB"
                fontSize={12}
                tick={{ fill: '#B0B3BB' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="natural"
                dataKey="value"
                stroke={changeInfo.isPositive ? '#16C784' : '#EA3943'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: changeInfo.isPositive ? '#16C784' : '#EA3943', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
});

PortfolioChart.displayName = 'PortfolioChart';

export default PortfolioChart;