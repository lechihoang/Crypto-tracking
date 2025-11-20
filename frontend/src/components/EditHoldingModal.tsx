'use client';

import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import { portfolioApi } from '@/lib/api';
import { toast } from 'sonner';
import { HoldingWithValue } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditHoldingModalProps {
  isOpen: boolean;
  holding: HoldingWithValue | null;
  onClose: () => void;
  onSuccess: () => void;
  hasBenchmark?: boolean;
}

export default function EditHoldingModal({ isOpen, holding, onClose, onSuccess }: EditHoldingModalProps) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (holding) {
      setQuantity(Number(holding.quantity).toString());
    }
  }, [holding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holding || !quantity) {
      toast.error('Vui lòng nhập số lượng');
      return;
    }

    setLoading(true);
    const coinName = holding.coinName;

    try {
      const updatePromise = (async () => {
        const result = await portfolioApi.updateHolding(holding._id, {
          quantity: parseFloat(quantity),
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      })();

      toast.promise(
        updatePromise,
        {
          loading: 'Đang cập nhật...',
          success: `Đã cập nhật ${coinName}`,
          error: 'Không thể cập nhật coin',
        }
      );

      await updatePromise;

      onSuccess();
      handleClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity('');
    onClose();
  };

  if (!holding) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && handleClose()}>
      <DialogContent className="bg-gray-800 border-gray-600/50 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Sửa {holding.coinName}</DialogTitle>
          <DialogDescription className="text-gray-300">
            Cập nhật số lượng {holding.coinSymbol.toUpperCase()} trong danh mục của bạn
          </DialogDescription>
        </DialogHeader>

        {/* Coin Info */}
        <div className="p-4 bg-gray-700 border border-gray-600/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{holding.coinName}</p>
              <p className="text-sm text-gray-300">{holding.coinSymbol.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Giá hiện tại</p>
              <p className="font-semibold text-white">
                ${Number(holding.currentPrice).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-gray-300">
              Số lượng *
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="any"
              min="0.00000001"
              placeholder="0.00000000"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || !quantity}
              className="bg-primary-500 hover:bg-primary-600"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
