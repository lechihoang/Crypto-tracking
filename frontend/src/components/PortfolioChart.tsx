'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { portfolioApi } from '@/lib/api';
import { Loader, TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioSnapshot {
  id: string;
  totalValue: number;
  createdAt: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  formattedDate: string;
}

export default function PortfolioChart() {
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
      } else if (result.data) {
        const history = result.data as Array<{ timestamp: number; totalValue: number; date: string }>;
        const processedData = history.map((dataPoint) => ({
          date: dataPoint.date,
          value: Number(dataPoint.totalValue),
          formattedDate: new Date(dataPoint.timestamp).toLocaleDateString('vi-VN'),
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setChartData(processedData);
        setError(''); // Clear any previous errors
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('API bị giới hạn tốc độ. Vui lòng đợi 1-2 phút và thử lại.');
      } else {
        setError('Không thể tải lịch sử giá trị portfolio');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyDetailed = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">{payload[0].payload.formattedDate}</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatCurrencyDetailed(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getChangeInfo = () => {
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
  };

  const changeInfo = getChangeInfo();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPortfolioHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold">Biểu đồ giá trị portfolio</h3>
          {chartData.length >= 2 && (
            <div className={`flex items-center gap-1 ${
              changeInfo.isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              <span className="font-medium">
                {changeInfo.isPositive ? '+' : ''}{changeInfo.percentage.toFixed(2)}%
              </span>
              <span className="text-sm text-gray-500">({timeRange}d)</span>
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">
            Chưa có dữ liệu lịch sử portfolio
          </p>
          <p className="text-sm text-gray-500">
            Dữ liệu sẽ được thu thập khi bạn thêm coin vào danh mục
          </p>
        </div>
      ) : chartData.length === 1 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {formatCurrency(chartData[0].value)}
          </p>
          <p className="text-gray-600 mb-4">
            Giá trị portfolio hiện tại
          </p>
          <p className="text-sm text-gray-500">
            Biểu đồ sẽ hiển thị khi có nhiều điểm dữ liệu theo thời gian
          </p>
        </div>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="formattedDate"
                stroke="#6b7280"
                fontSize={12}
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
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="natural"
                dataKey="value"
                stroke={changeInfo.isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: changeInfo.isPositive ? '#10b981' : '#ef4444', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}