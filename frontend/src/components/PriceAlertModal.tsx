'use client';

import { useState, useEffect, useRef } from 'react';
import { alertsApi, clientApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/utils/formatPrice';
import toast from 'react-hot-toast';
import { ChevronDown, Search } from 'lucide-react';
import { CryptoCurrency } from '@/types/crypto';
import Image from 'next/image';

interface ExistingAlert {
  id: string;
  condition: 'above' | 'below';
  targetPrice: number;
}

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinId?: string;
  coinName?: string;
  coinSymbol?: string;
  currentPrice?: number;
  existingAlert?: ExistingAlert;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  coinId,
  coinName,
  coinSymbol,
  currentPrice,
  existingAlert
}: PriceAlertModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Coin selection states
  const [selectedCoin, setSelectedCoin] = useState<CryptoCurrency | null>(null);
  const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState(false);
  const [coins, setCoins] = useState<CryptoCurrency[]>([]);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const coinDropdownRef = useRef<HTMLDivElement>(null);

  const conditions = [
    { value: 'above' as const, label: 'Khi giá vượt lên' },
    { value: 'below' as const, label: 'Khi giá giảm xuống' }
  ];

  // Check if coin is pre-selected (from props)
  const isCoinPreSelected = !!coinId;

  // Update form values when existingAlert changes
  useEffect(() => {
    if (existingAlert) {
      setCondition(existingAlert.condition);
      setTargetPrice(existingAlert.targetPrice.toString());
    } else {
      setCondition('above');
      setTargetPrice('');
    }
    setIsDropdownOpen(false);
  }, [existingAlert, isOpen]);

  // Fetch coins when modal opens and no coin is pre-selected
  useEffect(() => {
    if (isOpen && !isCoinPreSelected) {
      fetchCoins();
    }
  }, [isOpen, isCoinPreSelected]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (coinDropdownRef.current && !coinDropdownRef.current.contains(event.target as Node)) {
        setIsCoinDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCoins = async () => {
    setCoinsLoading(true);
    try {
      const result = await clientApi.getLatestListings(100);
      setCoins(result.data);
    } catch (error) {
      console.error('Failed to fetch coins:', error);
      toast.error('Không thể tải danh sách coin');
    } finally {
      setCoinsLoading(false);
    }
  };

  const handleConditionSelect = (value: 'above' | 'below') => {
    setCondition(value);
    setIsDropdownOpen(false);
  };

  const handleCoinSelect = (coin: CryptoCurrency) => {
    setSelectedCoin(coin);
    setIsCoinDropdownOpen(false);
  };

  const getSelectedLabel = () => {
    return conditions.find(c => c.value === condition)?.label || '';
  };

  const getActiveCoin = () => {
    if (isCoinPreSelected) {
      return { id: coinId!, name: coinName!, symbol: coinSymbol!, price: currentPrice! };
    }
    return selectedCoin ? {
      id: selectedCoin.id,
      name: selectedCoin.name,
      symbol: selectedCoin.symbol,
      price: selectedCoin.current_price || 0
    } : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const activeCoin = getActiveCoin();

    // Validate coin selection
    if (!activeCoin) {
      toast.error('Vui lòng chọn đồng coin');
      return;
    }

    // Validate price
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Vui lòng nhập giá hợp lệ');
      return;
    }

    setLoading(true);

    try {
      if (existingAlert) {
        // Delete old alert and create new one (update functionality)
        await alertsApi.deleteAlert(existingAlert.id);
      }

      // Build alert data
      const alertData = {
        coinId: activeCoin.id,
        condition,
        targetPrice: parseFloat(targetPrice)
      };

      const createPromise = alertsApi.createAlert(alertData);

      toast.promise(
        createPromise,
        {
          loading: existingAlert ? 'Đang cập nhật cảnh báo...' : 'Đang tạo cảnh báo...',
          success: existingAlert
            ? `Đã cập nhật cảnh báo cho ${activeCoin.name}`
            : `Đã tạo cảnh báo cho ${activeCoin.name}. Bạn sẽ nhận email khi điều kiện được đáp ứng.`,
          error: existingAlert ? 'Không thể cập nhật cảnh báo' : 'Không thể tạo cảnh báo',
        }
      );

      await createPromise;

      setTimeout(() => {
        onClose();
        setTargetPrice('');
      }, 1000);
    } catch {
      // Error already handled by toast.promise
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {existingAlert ? 'Sửa cảnh báo' : 'Tạo cảnh báo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Coin Selection or Display */}
          {!isCoinPreSelected ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn đồng coin
              </label>
              <div className="relative" ref={coinDropdownRef}>
                {/* Coin Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setIsCoinDropdownOpen(!isCoinDropdownOpen)}
                  disabled={coinsLoading}
                  className="w-full p-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-900 text-left hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {coinsLoading ? (
                    'Đang tải...'
                  ) : selectedCoin ? (
                    <div className="flex items-center gap-2">
                      {selectedCoin.image && (
                        <Image
                          src={selectedCoin.image}
                          alt={selectedCoin.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <span>{selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})</span>
                    </div>
                  ) : (
                    'Chọn đồng coin'
                  )}
                  <ChevronDown
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-transform ${isCoinDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Coin Dropdown Options */}
                {isCoinDropdownOpen && !coinsLoading && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {coins.map((coin) => (
                      <div
                        key={coin.id}
                        onClick={() => handleCoinSelect(coin)}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${
                          selectedCoin?.id === coin.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'bg-white text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {coin.image && (
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{coin.name}</div>
                          <div className="text-sm text-gray-500 uppercase">{coin.symbol}</div>
                        </div>
                        {coin.current_price && (
                          <div className="text-sm font-medium">${formatNumber(coin.current_price)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCoin && selectedCoin.current_price && (
                <p className="text-sm text-gray-600 mt-2">
                  Giá hiện tại: <span className="font-medium">${formatNumber(selectedCoin.current_price)}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {coinName} ({coinSymbol?.toUpperCase()})
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                Giá hiện tại: <span className="font-medium">${formatNumber(currentPrice!)}</span>
              </p>
            </div>
          )}

          {/* Condition Selection - Custom Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Điều kiện
            </label>
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-900 text-left hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {getSelectedLabel()}
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {conditions.map((cond) => (
                    <div
                      key={cond.value}
                      onClick={() => handleConditionSelect(cond.value)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        condition === cond.value
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {cond.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá mục tiêu (USD)
            </label>
            <input
              type="number"
              step="0.000001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Nhập giá mục tiêu"
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (existingAlert ? 'Đang cập nhật...' : 'Đang tạo...') : (existingAlert ? 'Cập nhật' : 'Tạo cảnh báo')}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              Cảnh báo sẽ được gửi đến email của bạn và tự động tắt sau khi kích hoạt.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
