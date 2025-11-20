import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoCurrency, CoinInfo } from '@/types/crypto';
import PriceChart from '@/components/PriceChart';
import { Card, CardContent } from '@/components/ui/card';

const formatPrice = (price: number) => {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatMarketCap = (marketCap: number) => {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toLocaleString()}`;
};

const formatSupply = (supply: number) => {
  if (supply >= 1e12) return `${(supply / 1e12).toFixed(2)}T`;
  if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B`;
  if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M`;
  return supply.toLocaleString();
};

interface CoinDetailContentProps {
  coin: CryptoCurrency;
  coinInfo: CoinInfo | null;
  coinId: string;
}

export default function CoinDetailContent({ coin, coinInfo, coinId }: CoinDetailContentProps) {
  const priceChange24h = coin.quote?.USD.percent_change_24h || 0;
  const isPositive = priceChange24h >= 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-dark-900 min-h-screen transition-colors duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Price Info */}
        <div className="lg:col-span-2">
          <Card className="p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-4xl font-bold text-gray-50">
                  {formatPrice(coin.quote?.USD.price || 0)}
                </h2>
                <div className={`flex items-center gap-2 mt-3 ${isPositive ? 'text-success-500' : 'text-danger-500'}`}>
                  {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="text-lg font-medium">
                    {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </span>
                  <span className="text-gray-100">24h</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-100">Xếp hạng</p>
                <p className="text-2xl font-bold text-primary-500">#{coin.cmc_rank || coin.market_cap_rank}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-100">Thay đổi 1h</p>
                <p className={`font-semibold ${(coin.quote?.USD.percent_change_1h || 0) >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {(coin.quote?.USD.percent_change_1h || 0) >= 0 ? '+' : ''}{(coin.quote?.USD.percent_change_1h || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-100">Thay đổi 7 ngày</p>
                <p className={`font-semibold ${(coin.quote?.USD.percent_change_7d || 0) >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {(coin.quote?.USD.percent_change_7d || 0) >= 0 ? '+' : ''}{(coin.quote?.USD.percent_change_7d || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-100">Thay đổi 30 ngày</p>
                <p className={`font-semibold ${(coin.quote?.USD.percent_change_30d || 0) >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {(coin.quote?.USD.percent_change_30d || 0) >= 0 ? '+' : ''}{(coin.quote?.USD.percent_change_30d || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-100">Khối lượng 24h</p>
                <p className="font-semibold text-gray-50">{formatMarketCap(coin.quote?.USD.volume_24h || 0)}</p>
              </div>
            </div>
          </Card>

          {/* Price Chart */}
          <PriceChart symbol={coin.symbol} currentPrice={coin.quote?.USD.price || 0} coinId={coinId} />
        </div>

        {/* Coin Info Sidebar */}
        <div className="space-y-6">
          {/* Market Stats */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-50 mb-4">Thống kê thị trường</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-100">Vốn hóa thị trường</span>
                  <span className="font-semibold text-gray-50">{formatMarketCap(coin.quote?.USD.market_cap || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-100">Nguồn cung lưu hành</span>
                  <span className="font-semibold text-gray-50">{formatSupply(coin.circulating_supply || 0)} {coin.symbol}</span>
                </div>
                {coin.total_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-100">Tổng nguồn cung</span>
                    <span className="font-semibold text-gray-50">{formatSupply(coin.total_supply)} {coin.symbol}</span>
                  </div>
                )}
                {coin.max_supply && (
                  <div className="flex justify-between">
                    <span className="text-gray-100">Nguồn cung tối đa</span>
                    <span className="font-semibold text-gray-50">{formatSupply(coin.max_supply)} {coin.symbol}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-100">Cặp giao dịch</span>
                  <span className="font-semibold text-gray-50">{coinInfo?.num_market_pairs || coin.num_market_pairs || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}