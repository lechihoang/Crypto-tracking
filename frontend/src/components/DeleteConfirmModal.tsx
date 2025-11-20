'use client';

import React from 'react';
import { AlertTriangle, Loader } from 'lucide-react';
import { HoldingWithValue } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  if (!holding) return null;

  const formatCurrency = (amount: number, showFullDecimals = false) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showFullDecimals ? 2 : 2,
      maximumFractionDigits: showFullDecimals ? 8 : 2,
    }).format(amount);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !loading && onCancel()}>
      <AlertDialogContent className="bg-gray-800 border-gray-600/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-100 flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-danger-500/20 rounded-full">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
            </div>
            Xóa {holding.coinName}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Bạn có chắc muốn xóa <strong className="text-gray-100">{holding.coinName}</strong> khỏi danh mục đầu tư?
            Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Holding Info */}
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Số lượng:</span>
            <span className="font-medium text-gray-200">
              {Number(holding.quantity).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
              })} {holding.coinSymbol.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Giá trị hiện tại:</span>
            <span className="font-medium text-gray-200">{formatCurrency(Number(holding.currentValue), true)}</span>
          </div>
          {holding.profitLoss !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Lãi/Lỗ:</span>
              <span className={`font-medium ${
                Number(holding.profitLoss) >= 0 ? 'text-success-500' : 'text-danger-500'
              }`}>
                {Number(holding.profitLoss) >= 0 ? '+' : ''}{formatCurrency(Math.abs(Number(holding.profitLoss)), true)}
              </span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100"
          >
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-danger-500 hover:bg-danger-600 text-white"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Xóa'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
