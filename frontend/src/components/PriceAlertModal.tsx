'use client';

import { useState, useEffect, useRef } from 'react';
import { alertsApi, clientApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/utils/formatPrice';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { CryptoCurrency } from '@/types/crypto';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PriceAlertModal({ isOpen, onClose }: PriceAlertModalProps) {
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

  // Fetch coins when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCoins();
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Validate coin selection
    if (!selectedCoin) {
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
      // Build alert data
      const alertData = {
        coinId: selectedCoin.id,
        condition,
        targetPrice: parseFloat(targetPrice)
      };

      const createPromise = alertsApi.createAlert(alertData);

      toast.promise(
        createPromise,
        {
          loading: 'Đang tạo cảnh báo...',
          success: `Đã tạo cảnh báo cho ${selectedCoin.name}. Bạn sẽ nhận email khi điều kiện được đáp ứng.`,
          error: 'Không thể tạo cảnh báo',
        }
      );

      await createPromise;

      setTimeout(() => {
        onClose();
        setTargetPrice('');
        setSelectedCoin(null);
      }, 1000);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo cảnh báo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coin Selection */}
          <div>
            <Label>Chọn đồng coin</Label>
            <div className="relative" ref={coinDropdownRef}>
              {/* Coin Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsCoinDropdownOpen(!isCoinDropdownOpen)}
                disabled={coinsLoading}
                className="w-full p-3 pr-10 border border-gray-600 rounded-lg bg-gray-800 text-gray-50 text-left hover:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${isCoinDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Coin Dropdown Options */}
              {isCoinDropdownOpen && !coinsLoading && (
                <div className="absolute z-10 w-full mt-1 bg-dark-600 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {coins.map((coin) => (
                    <div
                      key={coin.id}
                      onClick={() => handleCoinSelect(coin)}
                      className={`px-4 py-3 cursor-pointer transition-all duration-300 flex items-center gap-3 ${
                        selectedCoin?.id === coin.id
                          ? 'bg-primary-500/20 text-primary-400 font-medium'
                          : 'text-gray-200 hover:bg-dark-700'
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
                        <div className="text-sm text-gray-400 uppercase">{coin.symbol}</div>
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
              <p className="text-sm text-gray-400 mt-2">
                Giá hiện tại: <span className="font-semibold text-primary-400">${formatNumber(selectedCoin.current_price)}</span>
              </p>
            )}
          </div>

          {/* Condition Selection - Custom Dropdown */}
          <div>
            <Label>Điều kiện</Label>
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 pr-10 border border-gray-600 rounded-lg bg-gray-800 text-gray-50 text-left hover:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
              >
                {getSelectedLabel()}
                <ChevronDown
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-dark-600 border border-gray-700 rounded-lg shadow-xl">
                  {conditions.map((cond) => (
                    <div
                      key={cond.value}
                      onClick={() => handleConditionSelect(cond.value)}
                      className={`px-4 py-3 cursor-pointer transition-all duration-300 ${
                        condition === cond.value
                          ? 'bg-primary-500/20 text-primary-400 font-medium'
                          : 'text-gray-200 hover:bg-dark-700'
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
          <div>
            <Label htmlFor="targetPrice">Giá mục tiêu (USD)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.000001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Nhập giá mục tiêu"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Đang tạo...' : 'Tạo cảnh báo'}
            </Button>
          </div>

          <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-xs text-primary-400 font-medium">
              Cảnh báo sẽ được gửi đến email của bạn và tự động tắt sau khi kích hoạt.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
