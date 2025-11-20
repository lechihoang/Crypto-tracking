'use client';

import React, { useState, useEffect } from 'react';
import CryptoTable from '@/components/CryptoTable';
import { CryptoCurrency } from '@/types/crypto';
import { clientApi } from '@/lib/api';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
    <div className="bg-dark-900 min-h-full pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bảng giá tiền điện tử
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-gray-100 text-lg">
              Giá và dữ liệu thị trường theo thời gian thực
            </p>
            {lastUpdated && (
              <span className="text-sm text-gray-400">
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
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>

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
                    <PaginationItem key={1}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(1);
                        }}
                        isActive={currentPage === 1}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <PaginationItem key="ellipsis1">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                }

                // Visible pages
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(i);
                        }}
                        isActive={currentPage === i}
                      >
                        {i}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                // Last page
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <PaginationItem key="ellipsis2">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  pages.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }

                return pages;
              })()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  aria-disabled={currentPage >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}