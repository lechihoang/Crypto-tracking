'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardStats from '@/components/DashboardStats';
import DashboardPortfolio from '@/components/DashboardPortfolio';
import DashboardAlerts from '@/components/DashboardAlerts';
import LoadingSpinner from '@/components/LoadingSpinner';
import { portfolioApi, alertsApi, clientApi } from '@/lib/api';
import { PriceAlert, PortfolioValue } from '@/types';
import { Wallet, BarChart3, AlertCircle } from 'lucide-react';

// Type alias for holdings from PortfolioValue
type HoldingData = PortfolioValue['holdings'][number];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    holdings: [] as HoldingData[],
    totalProfitLoss: 0,
    coinsCount: 0
  });
  const [benchmarkData, setBenchmarkData] = useState<{
    profitLoss: number;
    profitLossPercentage: number;
    benchmark: { value: number; setAt: string } | null;
  } | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setStatsLoading(true);
    try {
      const [portfolioResult, benchmarkResult, alertsResult] = await Promise.all([
        portfolioApi.getPortfolioValue(),
        portfolioApi.getBenchmark().catch(() => ({ data: null })),
        alertsApi.getAlerts()
      ]);

      // Fetch coin images once for both portfolio and alerts
      let coinImageMap = new Map<string, string>();
      try {
        const coinsResult = await clientApi.getLatestListings(100);
        if (coinsResult.data) {
          coinImageMap = new Map(
            coinsResult.data
              .filter(coin => coin.image)
              .map(coin => [coin.slug, coin.image!])
          );
        }
      } catch (error) {
        console.log('Failed to fetch coin images:', error);
      }

      // Process portfolio data
      if (portfolioResult.data && typeof portfolioResult.data === 'object' && 'totalValue' in portfolioResult.data) {
        const data = portfolioResult.data as { totalValue: number; holdings: HoldingData[] };

        const holdingsWithImages = data.holdings.map(holding => ({
          ...holding,
          holding: {
            ...holding.holding,
            coinImage: holding.holding.coinImage || coinImageMap.get(holding.holding.coinId)
          }
        }));

        setPortfolioData({
          totalValue: Number(data.totalValue) || 0,
          holdings: holdingsWithImages,
          totalProfitLoss: holdingsWithImages.reduce((sum, h) => sum + (Number(h.profitLoss) || 0), 0),
          coinsCount: holdingsWithImages.length
        });
      }

      // Process benchmark data
      if (benchmarkResult.data && typeof benchmarkResult.data === 'object') {
        const bData = benchmarkResult.data as { benchmarkValue?: number; currentValue?: number; profitLoss?: number; profitLossPercentage?: number; benchmark?: { value: number; setAt: string } };

        if (bData.profitLoss !== undefined || bData.benchmark) {
          setBenchmarkData({
            profitLoss: bData.profitLoss || 0,
            profitLossPercentage: bData.profitLossPercentage || 0,
            benchmark: bData.benchmark || null,
          });
        }
      }

      // Process alerts data with coin images
      if (alertsResult.data) {
        const alertsWithImages = alertsResult.data.map((alert) => ({
          ...alert,
          coinImage: alert.coinImage || coinImageMap.get(alert.coinId)
        }));
        setAlerts(alertsWithImages);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    await alertsApi.deleteAlert(alertId);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const displayProfitLoss = benchmarkData?.benchmark ? benchmarkData.profitLoss : 0;
  const displayProfitLossPercentage = benchmarkData?.benchmark ? benchmarkData.profitLossPercentage : 0;

  const dashboardStats = [
    {
      title: 'Tổng giá trị danh mục',
      value: formatCurrency(portfolioData.totalValue),
      change: '',
      changeType: 'neutral' as const,
      icon: Wallet,
    },
    {
      title: 'Lãi/Lỗ tổng',
      value: formatCurrency(displayProfitLoss),
      change: benchmarkData?.benchmark ? formatPercentage(displayProfitLossPercentage) : '',
      changeType: displayProfitLoss >= 0 ? 'positive' as const : 'negative' as const,
      icon: BarChart3,
    },
    {
      title: 'Số đồng coin',
      value: portfolioData.coinsCount.toString(),
      change: '',
      changeType: 'neutral' as const,
      icon: BarChart3,
    },
    {
      title: 'Cảnh báo hoạt động',
      value: activeAlerts.length.toString(),
      change: '',
      changeType: 'neutral' as const,
      icon: AlertCircle,
    },
  ];

  if (loading) {
    return <LoadingSpinner fullScreen size="xl" />;
  }

  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chào mừng, {user?.name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Quản lý danh mục đầu tư crypto của bạn</p>
        </div>

        <DashboardStats stats={dashboardStats} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DashboardPortfolio
            holdings={portfolioData.holdings}
            totalValue={portfolioData.totalValue}
            coinsCount={portfolioData.coinsCount}
            formatCurrency={formatCurrency}
          />

          <DashboardAlerts
            alerts={alerts}
            onDeleteAlert={handleDeleteAlert}
            onAlertCreated={fetchDashboardData}
          />
        </div>
      </div>
    </div>
  );
}
