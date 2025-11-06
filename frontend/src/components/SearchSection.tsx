'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { CryptoCurrency } from '@/types/crypto';

interface SearchSectionProps {
  allCryptos: CryptoCurrency[];
  onCoinClick: (coinId: number | string) => void;
}

export default function SearchSection({ allCryptos, onCoinClick }: SearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const filteredCryptos = allCryptos.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCoinClickInternal = (coinId: number | string) => {
    setIsSearchOpen(false);
    setSearchTerm('');
    onCoinClick(coinId);
  };

  const handleSearchInputFocus = () => {
    if (searchTerm.length > 0) {
      setIsSearchOpen(true);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearchOpen(value.length > 0);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  return (
    <div ref={searchRef} className="bg-white p-8 rounded-xl shadow-xl mb-8 relative border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Tìm kiếm crypto</h3>
        <p className="text-base text-gray-600">Nhập tên hoặc ký hiệu của đồng tiền bạn muốn tìm</p>
      </div>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-hover:text-blue-500 transition-colors duration-200" />
        <input
          type="text"
          placeholder="Ví dụ: Bitcoin, BTC, Ethereum..."
          value={searchTerm}
          onChange={handleSearchInputChange}
          onFocus={handleSearchInputFocus}
          className="w-full pl-12 pr-12 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:outline-none text-lg placeholder-gray-500 transition-all duration-200 hover:border-gray-400 bg-gray-50 focus:bg-white text-gray-900"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isSearchOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-3 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
          {filteredCryptos.slice(0, 10).map((crypto, index) => (
            <button
              key={crypto.id}
              onClick={() => handleCoinClickInternal(crypto.id)}
              className={`w-full px-5 py-4 text-left hover:bg-blue-50 hover:border-l-4 hover:border-blue-500 flex items-center justify-between transition-all duration-200 ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === Math.min(filteredCryptos.length, 10) - 1 ? 'rounded-b-xl' : 'border-b border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full">
                  #{crypto.cmc_rank}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-base">{crypto.name}</div>
                  <div className="text-sm text-gray-600 font-medium">{crypto.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 text-base">
                  ${crypto.quote?.USD?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || 'N/A'}
                </div>
                <div className={`text-sm font-semibold flex items-center justify-end gap-1 ${
                  (crypto.quote?.USD?.percent_change_24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    (crypto.quote?.USD?.percent_change_24h || 0) >= 0 ? 'bg-green-600' : 'bg-red-600'
                  }`}></span>
                  {(crypto.quote?.USD?.percent_change_24h || 0) >= 0 ? '+' : ''}{(crypto.quote?.USD?.percent_change_24h || 0).toFixed(2)}%
                </div>
              </div>
            </button>
          ))}
          {filteredCryptos.length === 0 && (
            <div className="px-5 py-6 text-gray-600 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <div className="font-medium">Không tìm thấy kết quả phù hợp</div>
              <div className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}