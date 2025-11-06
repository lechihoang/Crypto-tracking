import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, Minus, Plus, Wrench, Trash2 } from 'lucide-react';
import { CryptoCurrency } from '@/types/crypto';
import { alertsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Lazy load PriceAlertModal
const PriceAlertModal = dynamic(() => import('./PriceAlertModal'), {
  ssr: false,
});

// Memoized PercentageChange component
const PercentageChange = React.memo(({ change }: { change: number }) => {
  const isPositive = change > 0;
  const isZero = Math.abs(change) < 0.01;

  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isZero
    ? 'text-gray-500'
    : isPositive
      ? 'text-green-600'
      : 'text-red-600';

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
    return <div className="w-36 h-12 flex items-center justify-center text-gray-400 text-xs">N/A</div>;
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

  const color = changePercent >= 0 ? '#16a34a' : '#dc2626'; // green-600 : red-600

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
  const { user } = useAuth();
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    coinId: string;
    coinSymbol: string;
    coinName: string;
    currentPrice: number;
    existingAlert?: {
      id: string;
      condition: 'above' | 'below';
      targetPrice: number;
    };
  }>({
    isOpen: false,
    coinId: '',
    coinSymbol: '',
    coinName: '',
    currentPrice: 0
  });
  interface AlertData {
    id: string;
    coinId: string;
    condition: 'above' | 'below';
    targetPrice: number;
    isActive: boolean;
  }

  const [userAlerts, setUserAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserAlerts();
    }
  }, [user]);

  const fetchUserAlerts = async () => {
    try {
      const result = await alertsApi.getAlerts();
      console.log('[CryptoTable] Alerts result:', result);
      if (result.data) {
        // Backend returns alerts with coinId (string format)
        const transformedAlerts = result.data.map(alert => ({
          id: alert.id,
          coinId: alert.coinId,
          condition: alert.condition,
          targetPrice: alert.targetPrice,
          isActive: alert.isActive
        }));
        console.log('[CryptoTable] Transformed alerts:', transformedAlerts);
        setUserAlerts(transformedAlerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const openAlertModal = (crypto: CryptoCurrency, existingAlert?: AlertData) => {
    setAlertModal({
      isOpen: true,
      coinId: crypto.slug || String(crypto.id), // Use slug as coinId (compatible with CoinGecko format)
      coinSymbol: crypto.symbol,
      coinName: crypto.name,
      currentPrice: crypto.quote?.USD.price || 0,
      existingAlert: existingAlert ? {
        id: existingAlert.id,
        condition: existingAlert.condition,
        targetPrice: existingAlert.targetPrice
      } : undefined
    });
  };

  const closeAlertModal = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
    // Refresh alerts after modal closes
    if (user) {
      fetchUserAlerts();
    }
  };

  const handleDeleteAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const deletePromise = alertsApi.deleteAlert(alertId);

      toast.promise(
        deletePromise,
        {
          loading: 'Đang xóa cảnh báo...',
          success: 'Đã xóa cảnh báo',
          error: 'Xóa cảnh báo thất bại',
        }
      );

      await deletePromise;
      fetchUserAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const getAlertForCoin = (coinSlug: string) => {
    return userAlerts.find(alert => alert.coinId === coinSlug && alert.isActive);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
        <p className="text-red-600 text-lg font-medium mb-4">{error}</p>
        <button 
          onClick={onRetry} 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full bg-white table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-12">
              #
            </th>
            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-36">
              Tên đồng tiền
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
              Giá
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">
              1h %
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">
              24h %
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">
              7 ngày %
            </th>
            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-28">
              <div>Vốn hóa</div>
              <div>thị trường</div>
            </th>
            <th className="px-3 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-28">
              Khối lượng (24h)
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-40">
              7d trước
            </th>
            <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cryptos.map((crypto) => (
            <tr key={crypto.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150">
              <td className="px-2 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  {crypto.cmc_rank}
                </div>
              </td>
              <td className="px-3 py-4">
                <Link href={`/coin/${crypto.slug}`} className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200">
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
                    <div className="text-base font-semibold text-gray-900 truncate" title={crypto.name}>
                      {crypto.name}
                    </div>
                    <div className="text-sm text-gray-600 font-medium truncate uppercase">
                      {crypto.symbol}
                    </div>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                {formatPrice(crypto.quote?.USD.price || 0)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <PercentageChange change={crypto.quote?.USD.percent_change_1h || 0} />
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <PercentageChange change={crypto.quote?.USD.percent_change_24h || 0} />
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <PercentageChange change={crypto.quote?.USD.percent_change_7d || 0} />
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatMarketCap(crypto.quote?.USD.market_cap || 0)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatVolume(crypto.quote?.USD.volume_24h || 0)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <MiniSparkline
                  data={crypto.sparkline_in_7d?.price}
                  changePercent={crypto.quote?.USD.percent_change_7d || 0}
                />
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {user ? (
                  (() => {
                    const existingAlert = getAlertForCoin(crypto.slug || crypto.id);
                    return existingAlert ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAlertModal(crypto, existingAlert);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200"
                          data-tooltip="Sửa cảnh báo"
                          aria-label="Sửa cảnh báo"
                        >
                          <Wrench size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteAlert(existingAlert.id, e)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                          data-tooltip="Xóa cảnh báo"
                          aria-label="Xóa cảnh báo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAlertModal(crypto);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                        data-tooltip="Tạo cảnh báo giá"
                        aria-label="Tạo cảnh báo giá"
                      >
                        <Plus size={16} />
                      </button>
                    );
                  })()
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = '/auth/login';
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                    title="Đăng nhập để tạo cảnh báo"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <PriceAlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlertModal}
        coinId={alertModal.coinId}
        coinSymbol={alertModal.coinSymbol}
        coinName={alertModal.coinName}
        currentPrice={alertModal.currentPrice}
        existingAlert={alertModal.existingAlert}
      />
    </div>
  );
});

CryptoTable.displayName = 'CryptoTable';

export default CryptoTable;