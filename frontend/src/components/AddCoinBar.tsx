'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader, X } from 'lucide-react';
import { portfolioApi, clientApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { CoinCombobox } from '@/components/CoinCombobox';
import { Coin } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const addCoinSchema = z.object({
  coin: z.object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    image: z.string(),
  }).nullable().refine((val) => val !== null, {
    message: 'Vui lòng chọn coin',
  }),
  quantity: z.string()
    .min(1, 'Vui lòng nhập số lượng')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Số lượng phải lớn hơn 0',
    }),
});

type AddCoinFormData = z.infer<typeof addCoinSchema>;

interface AddCoinBarProps {
  onSuccess: () => void;
}

export default function AddCoinBar({ onSuccess }: AddCoinBarProps) {
  const [showForm, setShowForm] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [coinsLoading, setCoinsLoading] = useState(false);

  const form = useForm<AddCoinFormData>({
    resolver: zodResolver(addCoinSchema),
    defaultValues: {
      coin: null,
      quantity: '',
    },
  });

  // Load top coins when form is shown
  useEffect(() => {
    if (showForm && coins.length === 0) {
      loadTopCoins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm]);

  const loadTopCoins = async () => {
    setCoinsLoading(true);
    try {
      const result = await clientApi.getLatestListings(100);
      if (result.data) {
        const coinData = result.data
          .filter(coin => coin.image)
          .map(coin => ({
            id: coin.slug || String(coin.id),
            name: coin.name,
            symbol: coin.symbol,
            image: coin.image!,
          }));
        setCoins(coinData);
      }
    } catch (error) {
      console.error('Failed to load coins:', error);
    } finally {
      setCoinsLoading(false);
    }
  };

  const onSubmit = async (data: AddCoinFormData) => {
    if (!data.coin) return;

    setLoading(true);
    const coinName = data.coin.name;

    try {
      const addPromise = (async () => {
        const result = await portfolioApi.addHolding({
          coinId: data.coin!.id,
          coinSymbol: data.coin!.symbol,
          coinName: data.coin!.name,
          coinImage: data.coin!.image,
          quantity: parseFloat(data.quantity),
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      })();

      toast.promise(
        addPromise,
        {
          loading: 'Đang thêm coin...',
          success: `Đã thêm ${coinName} vào danh mục`,
          error: 'Không thể thêm coin',
        }
      );

      await addPromise;

      // Reset form
      form.reset();
      setShowForm(false);
      onSuccess();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Card className="hover:shadow-lg transition-shadow p-4 mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-600/50 rounded-lg text-gray-300 hover:border-primary-500/50 hover:text-primary-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm coin vào danh mục đầu tư
        </button>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Thêm coin mới</h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Coin Selection */}
            <FormField
              control={form.control}
              name="coin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Chọn coin</FormLabel>
                  <FormControl>
                    {coinsLoading ? (
                      <div className="flex items-center justify-center h-10 bg-dark-600 border border-gray-700/40 rounded-lg">
                        <Loader className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <CoinCombobox
                        coins={coins}
                        value={field.value?.name || ''}
                        onChange={field.onChange}
                        placeholder="Tìm kiếm coin..."
                      />
                    )}
                  </FormControl>
                  <FormMessage className="text-danger-400" />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Số lượng</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      type="number"
                      step="any"
                      min="0.00000001"
                      placeholder="0.00000000"
                      className="w-full px-3 py-2 border border-gray-700/40 bg-dark-600 text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage className="text-danger-400" />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || form.formState.isSubmitting}
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-w-0"
              >
                {loading || form.formState.isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Đang thêm...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}