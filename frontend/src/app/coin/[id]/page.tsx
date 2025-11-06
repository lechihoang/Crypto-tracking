'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CryptoCurrency, CoinInfo } from '@/types/crypto';
import { clientApi } from '@/lib/api';
import CoinDetailContent from '@/components/CoinDetailContent';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CoinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [coin, setCoin] = useState<CryptoCurrency | null>(null);
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (!params.id) return;

      try {
        setLoading(true);

        // Fetch price data and coin info in Vietnamese in parallel
        const [quotesResponse, infoResponse] = await Promise.all([
          clientApi.getQuotes(params.id as string),
          clientApi.getCoinInfoVietnamese(params.id as string),
        ]);

        if (quotesResponse.data) {
          const coinData = Object.values(quotesResponse.data)[0] as CryptoCurrency;
          setCoin(coinData);
        }

        if (infoResponse.data) {
          const infoData = Object.values(infoResponse.data)[0] as CoinInfo;
          setCoinInfo(infoData);
        }
      } catch (err) {
        setError('Không thể tải dữ liệu coin');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [params.id]);

  if (loading) {
    return <LoadingSpinner fullScreen size="xl" />;
  }

  if (error || !coin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 text-center">
          <p className="text-red-600 text-lg font-medium mb-6">{error || 'Không tìm thấy đồng tiền'}</p>
          <Link 
            href="/" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {coin.name} ({coin.symbol})
            </h1>
          </div>
        </div>
      </header>

      <CoinDetailContent coin={coin} coinInfo={coinInfo} coinId={params.id as string} />
    </div>
  );
}