'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { portfolioApi } from '@/lib/api';
import { HoldingWithValue } from '@/types/common';
import { PortfolioHolding } from '@/types/portfolio';
import AddCoinBar from '@/components/AddCoinBar';
import PortfolioChart from '@/components/PortfolioChart';
import PortfolioPieChart from '@/components/PortfolioPieChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Loader, PieChart, Edit2, Trash2, Target, X, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

// Lazy load modals
const EditHoldingModal = dynamic(() => import('@/components/EditHoldingModal'), {
  ssr: false,
});

const DeleteConfirmModal = dynamic(() => import('@/components/DeleteConfirmModal'), {
  ssr: false,
});

interface BenchmarkData {
  benchmark: {
    value: number;
    setAt: string;
  } | null;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const [holdings, setHoldings] = useState<HoldingWithValue[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingHolding, setEditingHolding] = useState<HoldingWithValue | null>(null);
  const [deletingHolding, setDeletingHolding] = useState<HoldingWithValue | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [settingBenchmark, setSettingBenchmark] = useState(false);
  const [showBenchmarkWarning, setShowBenchmarkWarning] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
      fetchBenchmarkData();
    }
  }, [user]);

  // Auto-refresh portfolio data every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchPortfolioData(false); // Don't show loading for auto-refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchPortfolioData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      const result = await portfolioApi.getPortfolioValue();

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        const portfolioData = result.data as {
          totalValue: number;
          holdings: Array<{
            holding: PortfolioHolding;
            currentPrice: number;
            currentValue: number;
            profitLoss?: number;
            profitLossPercentage?: number;
          }>;
        };
        setTotalValue(portfolioData.totalValue || 0);
        setHoldings(portfolioData.holdings?.map((h) => ({
          ...h.holding,
          id: h.holding.id || '', // Map MongoDB _id to id
          currentPrice: h.currentPrice,
          value: h.currentValue, // Map to common type field name
          currentValue: h.currentValue,
          profitLoss: h.profitLoss,
          profitLossPercentage: h.profitLossPercentage,
        })) || []);
      }
      setLastUpdated(new Date());
    } catch {
      setError('Đã có lỗi xảy ra khi tải dữ liệu portfolio');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchBenchmarkData = async () => {
    try {
      const result = await portfolioApi.getBenchmark();
      if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
        const bData = result.data as Partial<BenchmarkData>;
        if ('benchmark' in bData || 'currentValue' in bData) {
          setBenchmarkData(bData as BenchmarkData);
        }
      }
    } catch {
      // Silent fail for benchmark data
    }
  };

  const handleSetBenchmark = async () => {
    if (!totalValue) return;

    setSettingBenchmark(true);
    try {
      const result = await portfolioApi.setBenchmark(totalValue);
      if (result.error) {
        setError(result.error);
      } else {
        await fetchBenchmarkData();
        // Hide benchmark warning after updating
        setShowBenchmarkWarning(false);
      }
    } catch {
      setError('Không thể đặt mốc');
    } finally {
      setSettingBenchmark(false);
    }
  };


  const formatCurrency = (amount: number, showFullDecimals = false) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showFullDecimals ? 2 : 2,
      maximumFractionDigits: showFullDecimals ? 8 : 2,
    }).format(amount);
  };

  const formatPercentage = (percentage?: number) => {
    if (percentage === undefined) return 'N/A';
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(4)}%`;
  };

  const handleDeleteHolding = async () => {
    if (!deletingHolding) return;

    const coinName = deletingHolding.coinName;
    setDeleteLoading(true);
    setDeletingHolding(null);

    try {
      const deletePromise = (async () => {
        const result = await portfolioApi.removeHolding(deletingHolding.id);
        if (result.error) {
          throw new Error(result.error);
        }

        // Create a snapshot after deleting holding
        try {
          await portfolioApi.createSnapshot();
        } catch (error) {
          console.log('Failed to create snapshot:', error);
        }

        await fetchPortfolioData();

        // Check if portfolio is now empty after deletion
        const updatedResult = await portfolioApi.getPortfolioValue();
        const isEmpty = !updatedResult.data ||
          (typeof updatedResult.data === 'object' && 'holdings' in updatedResult.data &&
           (!updatedResult.data.holdings || updatedResult.data.holdings.length === 0));

        // If portfolio is empty, delete the benchmark completely
        if (isEmpty && benchmarkData?.benchmark) {
          try {
            await portfolioApi.deleteBenchmark();
            await fetchBenchmarkData();
          } catch (error) {
            console.log('Failed to delete benchmark:', error);
          }
        } else if (benchmarkData?.benchmark) {
          setShowBenchmarkWarning(true);
        }
      })();

      toast.promise(
        deletePromise,
        {
          loading: 'Đang xóa coin...',
          success: `Đã xóa ${coinName} khỏi danh mục`,
          error: 'Không thể xóa coin',
        }
      );

      await deletePromise;
    } catch {
      // Error already handled by toast.promise
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Vui lòng đăng nhập để xem portfolio</p>
        </div>
      </div>
    );
  }

  // Calculate real-time benchmark data based on current totalValue
  // Don't show benchmark if portfolio is empty
  const realtimeBenchmarkData = benchmarkData?.benchmark && holdings.length > 0 ? {
    benchmark: benchmarkData.benchmark,
    currentValue: totalValue,
    profitLoss: totalValue - benchmarkData.benchmark.value,
    profitLossPercentage: benchmarkData.benchmark.value > 0
      ? ((totalValue - benchmarkData.benchmark.value) / benchmarkData.benchmark.value) * 100
      : 0
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Danh mục đầu tư</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600">Theo dõi danh mục đầu tư crypto của bạn</p>
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  • Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add Coin Bar */}
        <AddCoinBar onSuccess={async () => {
          const hadNoHoldings = holdings.length === 0;
          await fetchPortfolioData();

          // If this was the first coin added and no benchmark exists, auto-set it
          if (hadNoHoldings && !benchmarkData?.benchmark) {
            // Wait a bit for portfolio data to be updated
            setTimeout(async () => {
              const result = await portfolioApi.getPortfolioValue();
              if (result.data && typeof result.data === 'object' && 'totalValue' in result.data) {
                const newTotalValue = result.data.totalValue;
                if (newTotalValue > 0) {
                  try {
                    await portfolioApi.setBenchmark(newTotalValue);
                    await fetchBenchmarkData();
                    toast.success('Đã tự động đặt mốc đầu tư với giá trị hiện tại');
                  } catch (error) {
                    console.error('Failed to auto-set benchmark:', error);
                  }
                }
              }
            }, 500);
          } else if (benchmarkData?.benchmark) {
            // Show benchmark warning if benchmark exists
            setShowBenchmarkWarning(true);
          }
        }} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Benchmark Outdated Warning */}
        {showBenchmarkWarning && benchmarkData?.benchmark && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                    Mốc đầu tư có thể đã lỗi thời
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Danh mục đầu tư của bạn đã thay đổi (thêm/xóa coin). Bạn có muốn cập nhật mốc với giá trị hiện tại?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleSetBenchmark();
                        setShowBenchmarkWarning(false);
                      }}
                      disabled={settingBenchmark}
                      className="px-3 py-1.5 text-sm bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-400 rounded-lg transition-colors"
                    >
                      {settingBenchmark ? 'Đang cập nhật...' : 'Cập nhật mốc'}
                    </button>
                    <button
                      onClick={() => setShowBenchmarkWarning(false)}
                      className="px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBenchmarkWarning(false)}
                className="text-yellow-600 hover:text-yellow-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Benchmark Section & Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Benchmark Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mốc đầu tư</h3>
                  <p className="text-sm text-gray-600">Theo dõi lãi/lỗ so với giá trị ban đầu</p>
                </div>
              </div>
            </div>

            {realtimeBenchmarkData?.benchmark ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">Giá trị mốc</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(realtimeBenchmarkData.benchmark.value, true)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Đặt lúc: {new Date(realtimeBenchmarkData.benchmark.setAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">Giá trị hiện tại</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(realtimeBenchmarkData.currentValue, true)}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">Lãi/Lỗ từ mốc</p>
                  <p className={`text-xl font-bold ${realtimeBenchmarkData.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {realtimeBenchmarkData.profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(realtimeBenchmarkData.profitLoss), true)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-1">Lãi/Lỗ % từ mốc</p>
                  <p className={`text-xl font-bold ${realtimeBenchmarkData.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(realtimeBenchmarkData.profitLossPercentage)}
                  </p>
                </div>

                {totalValue > 0 ? (
                  <button
                    onClick={handleSetBenchmark}
                    disabled={settingBenchmark}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {settingBenchmark ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Flag size={16} />
                    )}
                    Cập nhật mốc với giá hiện tại
                  </button>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 text-center">
                      Hãy thêm đồng tiền để theo dõi lãi/lỗ
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                {holdings.length === 0 ? (
                  <>
                    <p className="text-gray-600 mb-2">Chưa có đồng tiền nào</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Hãy thêm đồng tiền vào danh mục để bắt đầu theo dõi lãi/lỗ
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">Chưa đặt mốc đầu tư</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Đặt giá trị hiện tại làm mốc để theo dõi lãi/lỗ từ thời điểm này
                    </p>
                    <button
                      onClick={handleSetBenchmark}
                      disabled={settingBenchmark || !totalValue}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {settingBenchmark ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Flag size={16} />
                      )}
                      Đặt giá hiện tại làm mốc
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Portfolio Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phân bổ danh mục</h3>
                <p className="text-sm text-gray-600">Tỷ trọng các đồng coin hiện tại</p>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Chưa có dữ liệu</p>
                <p className="text-sm text-gray-500">
                  Thêm coin vào danh mục để xem biểu đồ phân bổ
                </p>
              </div>
            ) : (
              <PortfolioPieChart holdings={holdings} totalValue={totalValue} />
            )}
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="mb-8">
          <PortfolioChart />
        </div>

        {/* Holdings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách coin</h3>
          </div>

          {holdings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Danh mục trống
              </h4>
              <p className="text-gray-600 mb-4">
                Thêm các đồng coin đã mua để bắt đầu theo dõi danh mục đầu tư
              </p>
              <p className="text-sm text-gray-500">
                Sử dụng form ở trên để thêm coin đầu tiên
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá/coin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng giá trị
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.map((holding) => (
                    <tr key={holding.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {holding.coinName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {holding.coinSymbol.toUpperCase()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(holding.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(Number(holding.currentPrice), true)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(Number(holding.currentValue), true)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingHolding(holding)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingHolding(holding)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Holding Modal */}
        <EditHoldingModal
          isOpen={!!editingHolding}
          holding={editingHolding}
          onClose={() => setEditingHolding(null)}
          onSuccess={() => {
            fetchPortfolioData();
            // Show benchmark warning if benchmark exists
            if (benchmarkData?.benchmark) {
              setShowBenchmarkWarning(true);
            }
          }}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!deletingHolding}
          holding={deletingHolding}
          loading={deleteLoading}
          onConfirm={handleDeleteHolding}
          onCancel={() => setDeletingHolding(null)}
        />
      </main>
    </div>
  );
}