'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { portfolioApi, clientApi } from '@/lib/api';
import CoinSelector from '@/components/CoinSelector';
import AddHoldingForm from '@/components/AddHoldingForm';
import { Coin } from '@/types';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddHoldingModal({ isOpen, onClose, onSuccess }: AddHoldingModalProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});

  // Load top coins on modal open
  React.useEffect(() => {
    if (isOpen && coins.length === 0) {
      loadTopCoins();
    }
  }, [isOpen, coins.length]);

  const loadTopCoins = async () => {
    setSearchLoading(true);
    try {
      const result = await clientApi.getLatestListings(50);
      if (result.data) {
        setCoins(result.data.map((coin: {
          id: string;
          name: string;
          symbol: string;
          slug: string;
        }) => ({
          id: coin.slug || coin.id,
          name: coin.name,
          symbol: coin.symbol,
        })));
      }
    } catch (error) {
      console.error('Failed to load coins:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    setFormValues({
      ...formValues,
      coinId: coin.id,
      coinSymbol: coin.symbol,
      coinName: coin.name,
    });
  };

  const removeCoin = () => {
    setSelectedCoin(null);
    setFormValues({
      ...formValues,
      coinId: '',
      coinSymbol: '',
      coinName: '',
    });
  };

  const setValue = (field: string, value: string | number) => {
    setFormValues({ ...formValues, [field]: value });
  };

  const onSubmit = async (data: Record<string, string | number>) => {
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formValues, ...data };
      const result = await portfolioApi.addHolding({
        coinId: String(submitData.coinId),
        coinSymbol: String(submitData.coinSymbol),
        coinName: String(submitData.coinName),
        quantity: Number(submitData.quantity),
        averageBuyPrice: submitData.averageBuyPrice ? Number(submitData.averageBuyPrice) : undefined,
        notes: submitData.notes ? String(submitData.notes) : undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
        handleClose();
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCoin(null);
    setFormValues({});
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Thêm Holding</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Coin Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Coin
            </label>
            <CoinSelector
              coins={coins}
              selectedCoin={selectedCoin}
              searchLoading={searchLoading}
              onCoinSelect={selectCoin}
              onCoinRemove={removeCoin}
            />
            {!selectedCoin && formValues.coinId === '' && (
              <p className="mt-1 text-sm text-red-600">Vui lòng chọn coin</p>
            )}
          </div>

          <AddHoldingForm
            isSubmitting={loading}
            onSubmit={onSubmit}
            onCancel={handleClose}
            setValue={setValue}
          />
        </div>
      </div>
    </div>
  );
}