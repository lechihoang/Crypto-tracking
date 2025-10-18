'use client';

import Link from 'next/link';
import { Plus, Wallet } from 'lucide-react';

interface HoldingData {
  holding: {
    id: string;
    coinId: string;
    coinSymbol: string;
    coinName: string;
    coinImage?: string;
    quantity: number;
  };
  currentValue: number;
}

interface DashboardPortfolioProps {
  holdings: HoldingData[];
  totalValue: number;
  coinsCount: number;
  formatCurrency: (amount: number) => string;
}

export default function DashboardPortfolio({
  holdings,
  totalValue,
  coinsCount,
  formatCurrency
}: DashboardPortfolioProps) {
  if (coinsCount === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Danh mục đầu tư</h3>
          <Link href="/portfolio" className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
            Xem chi tiết
          </Link>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Chưa có coin nào</h4>
          <p className="text-gray-600 mb-6">Thêm coin để bắt đầu theo dõi danh mục của bạn</p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Quản lý danh mục</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Danh mục đầu tư</h3>
        <Link href="/portfolio" className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
          Xem chi tiết
        </Link>
      </div>

      <div className="space-y-3 mb-4">
        {holdings
          .sort((a, b) => b.currentValue - a.currentValue)
          .slice(0, 5)
          .map((holding) => {
            const { coinSymbol, coinName, coinImage, quantity } = holding.holding;
            const percentage = totalValue > 0 ? (holding.currentValue / totalValue * 100).toFixed(2) : '0';

            return (
              <div
                key={holding.holding.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {coinImage ? (
                    <img
                      src={coinImage}
                      alt={coinSymbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${coinImage ? 'hidden' : ''}`}
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                  >
                    <span className="text-lg font-bold text-white">
                      {coinSymbol.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{coinName}</h4>
                    <p className="text-xs text-gray-600">
                      {Number(quantity).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8
                      })} {coinSymbol.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(holding.currentValue)}</p>
                  <p className="text-xs text-gray-600">{percentage}%</p>
                </div>
              </div>
            );
          })}
      </div>

      {coinsCount > 3 && (
        <p className="text-sm text-gray-500 text-center mb-4">
          +{coinsCount - 3} coin khác
        </p>
      )}

      <Link
        href="/portfolio"
        className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Xem tất cả
      </Link>
    </div>
  );
}
