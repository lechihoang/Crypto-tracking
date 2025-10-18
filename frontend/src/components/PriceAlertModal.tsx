'use client';

import { useState, useEffect } from 'react';
import { alertsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { formatNumber } from '@/utils/formatPrice';
import toast from 'react-hot-toast';

interface ExistingAlert {
  id: string;
  condition: 'above' | 'below';
  targetPrice: number;
}

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  coinId: number;
  coinSymbol: string;
  coinName: string;
  coinImage?: string;
  currentPrice: number;
  existingAlert?: ExistingAlert;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  coinId,
  coinSymbol,
  coinName,
  coinImage,
  currentPrice,
  existingAlert
}: PriceAlertModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // Update form values when existingAlert changes
  useEffect(() => {
    if (existingAlert) {
      setCondition(existingAlert.condition);
      setTargetPrice(existingAlert.targetPrice.toString());
    } else {
      setCondition('above');
      setTargetPrice('');
    }
  }, [existingAlert, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/auth/login');
      return;
    }

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

      const createPromise = alertsApi.createAlert({
        coinId,
        coinSymbol,
        coinName,
        coinImage,
        condition,
        targetPrice: price
      });

      toast.promise(
        createPromise,
        {
          loading: existingAlert ? 'Đang cập nhật cảnh báo...' : 'Đang tạo cảnh báo...',
          success: existingAlert
            ? `Đã cập nhật cảnh báo cho ${coinName}`
            : `Đã tạo cảnh báo cho ${coinName}. Bạn sẽ nhận email khi giá đạt mức đã đặt.`,
          error: existingAlert ? 'Không thể cập nhật cảnh báo' : 'Không thể tạo cảnh báo',
        }
      );

      await createPromise;

      setTimeout(() => {
        onClose();
        setTargetPrice('');
      }, 1000);
    } catch (error) {
      // Error already handled by toast.promise
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {existingAlert ? 'Sửa cảnh báo giá' : 'Tạo cảnh báo giá'}
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
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {coinName} ({coinSymbol.toUpperCase()})
              </h4>
            </div>
            <p className="text-sm text-gray-600">
              Giá hiện tại: <span className="font-medium">${formatNumber(currentPrice)}</span>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Điều kiện cảnh báo
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
              className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="above">Khi giá vượt lên</option>
              <option value="below">Khi giá giảm xuống</option>
            </select>
          </div>

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
              💡 Cảnh báo sẽ được gửi đến email của bạn và tự động tắt sau khi kích hoạt.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}