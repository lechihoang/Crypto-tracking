import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CryptoCurrency } from '@/types/crypto';

// Memoized PercentageChange component
const PercentageChange = React.memo(({ change }: { change: number }) => {
  const isPositive = change > 0;
  const isZero = Math.abs(change) < 0.01;

  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isZero
    ? 'text-gray-500'
    : isPositive
      ? 'text-success-500'
      : 'text-danger-500';

  return (
    <div className={`flex items-center gap-1 font-semibold ${colorClass}`}>
      <Icon size={16} />
      <span>{Math.abs(change).toFixed(2)}%</span>
    </div>
  );
});

PercentageChange.displayName = 'PercentageChange';

// Format functions for full precision display
const formatPrice = (price: number) => {
  return `$${price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })}`;
};

const formatMarketCap = (value: number) => {
  if (value >= 1e12) {
    return `$${(value / 1e12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatVolume = (value: number) => {
  if (value >= 1e9) {
    return `$${(value / 1e9).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Memoized Mini sparkline chart component
const MiniSparkline = React.memo(({ data, changePercent }: { data?: number[], changePercent: number }) => {
  if (!data || data.length === 0) {
    return <div className="w-36 h-12 flex items-center justify-center text-gray-500 text-xs">N/A</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const width = 144; // w-36 = 144px
  const height = 48; // h-12 = 48px

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Use CSS variables for colors
  const color = changePercent >= 0 ? 'rgb(22, 199, 132)' : 'rgb(234, 57, 67)'; // success-500 : danger-500

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

MiniSparkline.displayName = 'MiniSparkline';

interface CryptoTableProps {
  cryptos: CryptoCurrency[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const CryptoTable = React.memo(function CryptoTable({ cryptos, loading, error, onRetry }: CryptoTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 bg-gray-800 rounded-xl border border-dark-500/50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200/30 border-t-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-xl border border-dark-500/50">
        <p className="text-danger-500 text-lg font-medium mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all duration-300"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dark-500/50 bg-gray-800 overflow-x-auto">
      <table className="w-full bg-transparent table-fixed">
            <thead className="bg-gray-800 border-b border-dark-500/50 sticky top-0 z-10">
              <tr>
                <th className="pl-6 pr-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-16">
                  #
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-40">
                  Tên đồng tiền
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-32">
                  Giá
                </th>
                <th className="px-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-24">
                  1h %
                </th>
                <th className="px-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-24">
                  24h %
                </th>
                <th className="px-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-24">
                  7 ngày %
                </th>
                <th className="px-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-32">
                  <div>Vốn hóa</div>
                  <div>thị trường</div>
                </th>
                <th className="px-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-32">
                  Khối lượng (24h)
                </th>
                <th className="px-3 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider w-40">
                  7d trước
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-dark-500/30">
              {cryptos.map((crypto) => (
                <tr key={crypto.id} className="hover:bg-gray-700 cursor-pointer transition-colors duration-150 border-b border-dark-500/30 last:border-b-0">
                  <td className="pl-6 pr-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-100">
                      {crypto.cmc_rank}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/coin/${crypto.slug}`} className="flex items-center gap-2 hover:text-primary-500 transition-colors duration-200">
                      <div className="relative w-7 h-7 flex-shrink-0">
                        <Image
                          src={crypto.image || `https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`}
                          alt={crypto.name}
                          width={28}
                          height={28}
                          className="rounded-full"
                          unoptimized
                        />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-base font-semibold text-gray-50 truncate" title={crypto.name}>
                          {crypto.name}
                        </div>
                        <div className="text-sm text-gray-200 font-medium truncate uppercase">
                          {crypto.symbol}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-base font-bold text-gray-50">
                    {formatPrice(crypto.quote?.USD.price || 0)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <PercentageChange change={crypto.quote?.USD.percent_change_1h || 0} />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <PercentageChange change={crypto.quote?.USD.percent_change_24h || 0} />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <PercentageChange change={crypto.quote?.USD.percent_change_7d || 0} />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                    {formatMarketCap(crypto.quote?.USD.market_cap || 0)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                    {formatVolume(crypto.quote?.USD.volume_24h || 0)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <MiniSparkline
                      data={crypto.sparkline_in_7d?.price}
                      changePercent={crypto.quote?.USD.percent_change_7d || 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
      </table>
    </div>
  );
});

CryptoTable.displayName = 'CryptoTable';

export default CryptoTable;