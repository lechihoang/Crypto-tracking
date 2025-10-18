'use client';

import React from 'react';
import { AlertTriangle, Loader, X } from 'lucide-react';

interface HoldingWithValue {
  id: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  quantity: number;
  averageBuyPrice?: number;
  notes?: string;
  currentPrice: number;
  currentValue: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  holding: HoldingWithValue | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  holding,
  loading,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !holding) return null;

  const formatCurrency = (amount: number, showFullDecimals = false) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showFullDecimals ? 2 : 2,
      maximumFractionDigits: showFullDecimals ? 8 : 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Xóa {holding.coinName}</h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            Bạn có chắc muốn xóa <strong>{holding.coinName}</strong> khỏi danh mục đầu tư?
            Hành động này không thể hoàn tác.
          </p>

          {/* Holding Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Số lượng:</span>
              <span className="font-medium">
                {Number(holding.quantity).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                })} {holding.coinSymbol.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Giá trị hiện tại:</span>
              <span className="font-medium">{formatCurrency(Number(holding.currentValue), true)}</span>
            </div>
            {holding.profitLoss !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lãi/Lỗ:</span>
                <span className={`font-medium ${
                  Number(holding.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Number(holding.profitLoss) >= 0 ? '+' : ''}{formatCurrency(Math.abs(Number(holding.profitLoss)), true)}
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Xóa'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}