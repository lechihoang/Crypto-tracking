'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Wallet } from 'lucide-react';
import { PortfolioValue } from '@/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Type alias for holdings from PortfolioValue
type HoldingData = PortfolioValue['holdings'][number];

interface DashboardPortfolioProps {
  holdings: HoldingData[];
  totalValue: number;
  coinsCount: number;
  formatCurrency: (amount: number) => string;
}

const DashboardPortfolio = React.memo(function DashboardPortfolio({
  holdings,
  totalValue,
  coinsCount,
  formatCurrency
}: DashboardPortfolioProps) {
  if (coinsCount === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Danh mục đầu tư</h3>
          <Link href="/portfolio" className="text-primary-500 hover:text-primary-600 text-sm font-semibold transition-colors">
            Xem chi tiết
          </Link>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">Chưa có coin nào</h4>
          <p className="text-gray-300 mb-6">Thêm coin để bắt đầu theo dõi danh mục của bạn</p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Quản lý danh mục</span>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Danh mục đầu tư</h3>
        <Link href="/portfolio" className="text-primary-500 hover:text-primary-600 text-sm font-semibold transition-colors">
          Xem chi tiết
        </Link>
      </div>

      <ScrollArea className="h-[400px] mb-4">
        <div className="space-y-3 pr-4">
          {holdings
            .sort((a, b) => b.currentValue - a.currentValue)
            .slice(0, 5)
            .map((holding, index) => {
            const { coinSymbol, coinName, coinImage, quantity } = holding.holding;
            const percentage = totalValue > 0 ? (holding.currentValue / totalValue * 100).toFixed(2) : '0';

            return (
              <div
                key={`${holding.holding._id}-${holding.holding.coinId}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600/30"
              >
                <div className="flex items-center gap-3">
                  {coinImage ? (
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image
                        src={coinImage}
                        alt={coinSymbol}
                        width={40}
                        height={40}
                        className="rounded-full"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                    >
                      <span className="text-lg font-bold text-white">
                        {coinSymbol.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-white">{coinName}</h4>
                    <p className="text-xs text-gray-300">
                      {Number(quantity).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8
                      })} {coinSymbol.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatCurrency(holding.currentValue)}</p>
                  <p className="text-xs text-gray-300">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {coinsCount > 5 && (
        <p className="text-sm text-gray-400 text-center">
          +{coinsCount - 5} coin khác
        </p>
      )}
    </Card>
  );
});

DashboardPortfolio.displayName = 'DashboardPortfolio';

export default DashboardPortfolio;
