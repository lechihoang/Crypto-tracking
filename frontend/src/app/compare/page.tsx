'use client';

import React, { useState, useEffect } from 'react';
import CryptoTable from '@/components/CryptoTable';
import { CryptoCurrency } from '@/types/crypto';
import { clientApi } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ComparePage() {
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCoins, setTotalCoins] = useState(0);

  const fetchCryptos = async (page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      setError(null);

      // CoinGecko API supports true pagination with page parameter
      // Max per_page is 250, and supports up to 10,000+ coins
      const data = await clientApi.getLatestListings(size, page);

      setCryptos(data.data);

      // CoinGecko has 10,000+ coins, but we'll limit to 5000 for practical purposes
      setTotalCoins(5000);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch cryptocurrency data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(() => fetchCryptos(), 30000); // Update every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCoins / pageSize);

  return (
    <div className="bg-gray-50 min-h-full pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bảng xếp hạng tiền điện tử
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-gray-700 text-lg">
              Giá tiền điện tử và dữ liệu thị trường theo thời gian thực
            </p>
            {lastUpdated && (
              <span className="text-sm text-gray-700">
                • Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        <CryptoTable
          cryptos={cryptos}
          loading={loading}
          error={error}
          onRetry={fetchCryptos}
        />

        {/* Pagination Controls - Bottom */}
        {!loading && !error && cryptos.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Page Numbers */}
            {(() => {
              const pages = [];
              const maxVisible = 7;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              const endPage = Math.min(totalPages, startPage + maxVisible - 1);

              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // First page
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="min-w-[48px] px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-lg font-semibold transition-all"
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(<span key="dots1" className="px-2 text-gray-700 text-xl font-bold">...</span>);
                }
              }

              // Visible pages
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`min-w-[48px] px-4 py-2 rounded-lg text-lg font-bold transition-all ${
                      currentPage === i
                        ? 'bg-blue-600 text-white border-2 border-blue-600'
                        : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-900'
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              // Last page
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="dots2" className="px-2 text-gray-700 text-xl font-bold">...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="min-w-[48px] px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-lg font-semibold transition-all"
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}