'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Coin } from '@/types';

interface CoinSelectorProps {
  coins: Coin[];
  selectedCoin: Coin | null;
  searchLoading: boolean;
  onCoinSelect: (coin: Coin) => void;
  onCoinRemove: () => void;
}

export default function CoinSelector({
  coins,
  selectedCoin,
  searchLoading,
  onCoinSelect,
  onCoinRemove
}: CoinSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedCoin) {
    return (
      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
        <div>
          <div className="font-medium text-gray-900">{selectedCoin.name}</div>
          <div className="text-sm text-gray-500">{selectedCoin.symbol.toUpperCase()}</div>
        </div>
        <button
          type="button"
          onClick={onCoinRemove}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm coin..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {searchTerm && (
        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          {searchLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="w-4 h-4 animate-spin border-2 border-gray-300 border-t-blue-500 rounded-full" />
            </div>
          ) : filteredCoins.length > 0 ? (
            filteredCoins.slice(0, 10).map((coin) => (
              <button
                key={coin.id}
                type="button"
                onClick={() => onCoinSelect(coin)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
              >
                <div>
                  <div className="font-medium text-gray-900">{coin.name}</div>
                  <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Không tìm thấy coin nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}