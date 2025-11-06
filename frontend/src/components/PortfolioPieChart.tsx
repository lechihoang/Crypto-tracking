'use client';

import React, { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { HoldingWithValue } from '@/types';

interface PortfolioPieChartProps {
  holdings: HoldingWithValue[];
  totalValue: number;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
];

const PortfolioPieChart = React.memo(function PortfolioPieChart({ holdings, totalValue }: PortfolioPieChartProps) {
  const chartData = useMemo(() =>
    holdings
      .map((holding) => ({
        name: holding.coinSymbol.toUpperCase(),
        value: Number(holding.currentPrice),
        percentage: totalValue > 0 ? (Number(holding.currentPrice) / totalValue) * 100 : 0,
        fullName: holding.coinName,
      }))
      .sort((a, b) => b.value - a.value), // Sort by value descending
    [holdings, totalValue]
  );

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  interface ChartDataPoint {
    name: string;
    value: number;
    percentage: number;
    fullName: string;
  }

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: ChartDataPoint;
    }>;
  }

  const CustomTooltip = useCallback(({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.fullName}</p>
          <p className="text-sm text-gray-600">{data.name}</p>
          <p className="text-base font-bold text-blue-600 mt-1">
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-500">
            {data.percentage.toFixed(2)}% của tổng
          </p>
        </div>
      );
    }
    return null;
  }, [formatCurrency]);

  interface LegendProps {
    payload?: Array<{
      value: string;
      color: string;
      payload: ChartDataPoint;
    }>;
  }

  const CustomLegend = ({ payload }: LegendProps) => {
    if (!payload) return null;

    return (
      <div className="mt-4 grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {payload.map((entry, index: number) => (
          <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 font-medium">{entry.value}</span>
            </div>
            <span className="text-gray-600">
              {entry.payload.percentage.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              // @ts-expect-error - Recharts label typing is complex
              label={((props: { percentage?: number }) => {
                const percentage = props.percentage;
                return percentage ? `${percentage.toFixed(1)}%` : '';
              })}
              innerRadius={60}
              outerRadius={95}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Tổng giá trị</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </div>

      <CustomLegend payload={chartData.map((item, index) => ({
        value: item.name,
        color: COLORS[index % COLORS.length],
        payload: item,
      }))} />
    </div>
  );
});

PortfolioPieChart.displayName = 'PortfolioPieChart';

export default PortfolioPieChart;
