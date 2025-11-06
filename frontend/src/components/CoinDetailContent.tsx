import React from 'react';
import { TrendingUp, TrendingDown, Globe, MessageCircle, ExternalLink } from 'lucide-react';
import { CryptoCurrency, CoinInfo } from '@/types/crypto';
import PriceChart from '@/components/PriceChart';

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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen transition-colors duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Price Info */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-xl mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">
                  {formatPrice(coin.quote?.USD.price || 0)}
                </h2>
                <div className={`flex items-center gap-2 mt-3 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="text-lg font-medium">
                    {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </span>
                  <span className="text-gray-700">24h</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-700">Xếp hạng</p>
                <p className="text-2xl font-bold text-blue-600">#{coin.cmc_rank || coin.market_cap_rank}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-700">Thay đổi 1h</p>
                <p className={`font-semibold ${(coin.quote?.USD.percent_change_1h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(coin.quote?.USD.percent_change_1h || 0) >= 0 ? '+' : ''}{(coin.quote?.USD.percent_change_1h || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Thay đổi 7 ngày</p>
                <p className={`font-semibold ${(coin.quote?.USD.percent_change_7d || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(coin.quote?.USD.percent_change_7d || 0) >= 0 ? '+' : ''}{(coin.quote?.USD.percent_change_7d || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Thay đổi 30 ngày</p>
                <p className={`font-semibold ${(coin.quote?.USD.percent_change_30d || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(coin.quote?.USD.percent_change_30d || 0) >= 0 ? '+' : ''}{(coin.quote?.USD.percent_change_30d || 0).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Khối lượng 24h</p>
                <p className="font-semibold text-gray-900">{formatMarketCap(coin.quote?.USD.volume_24h || 0)}</p>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <PriceChart symbol={coin.symbol} currentPrice={coin.quote?.USD.price || 0} coinId={coinId} />
        </div>

        {/* Coin Info Sidebar */}
        <div className="space-y-6">
          {/* Market Stats */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê thị trường</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Vốn hóa thị trường</span>
                <span className="font-semibold text-gray-900">{formatMarketCap(coin.quote?.USD.market_cap || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Nguồn cung lưu hành</span>
                <span className="font-semibold text-gray-900">{formatSupply(coin.circulating_supply || 0)} {coin.symbol}</span>
              </div>
              {coin.total_supply && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Tổng nguồn cung</span>
                  <span className="font-semibold text-gray-900">{formatSupply(coin.total_supply)} {coin.symbol}</span>
                </div>
              )}
              {coin.max_supply && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Nguồn cung tối đa</span>
                  <span className="font-semibold text-gray-900">{formatSupply(coin.max_supply)} {coin.symbol}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700">Cặp giao dịch</span>
                <span className="font-semibold text-gray-900">{coinInfo?.num_market_pairs || coin.num_market_pairs || 0}</span>
              </div>
            </div>
          </div>

          {/* About */}
          {coinInfo && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Giới thiệu về {coinInfo.name}</h3>
              {coinInfo.description && (
                <div className="text-gray-700 text-base mb-6 leading-relaxed">
                  <p className="whitespace-pre-wrap">
                    {coinInfo.description.slice(0, 500)}...
                  </p>
                </div>
              )}
              
              {/* Tags */}
              {coinInfo.tags && coinInfo.tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Nhãn</p>
                  <div className="flex flex-wrap gap-2">
                    {coinInfo.tags.slice(0, 6).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {String(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="space-y-2">
                {coinInfo.urls?.website?.[0] && (
                  <a
                    href={coinInfo.urls.website[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Trang web
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {coinInfo.urls?.message_board?.[0] && (
                  <a
                    href={coinInfo.urls.message_board[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Cộng đồng
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}