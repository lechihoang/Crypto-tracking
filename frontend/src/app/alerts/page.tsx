'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { alertsApi } from '@/lib/api';
import { PriceAlert } from '@/types/alerts';
import { formatNumber } from '@/utils/formatPrice';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, Bell, Search } from 'lucide-react';
import Image from 'next/image';
import PriceAlertModal from '@/components/PriceAlertModal';
import EditAlertModal from '@/components/EditAlertModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<PriceAlert | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch alerts on mount
  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertsApi.getAlerts();
      if (response.data) {
        setAlerts(response.data);
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Không thể tải danh sách cảnh báo');
    } finally {
      setLoading(false);
    }
  };

  // Filter alerts based on search query and exclude triggered alerts
  const filteredAlerts = useMemo(() => {
    // First, filter out triggered/inactive alerts
    const activeAlerts = alerts.filter(alert => alert.isActive && !alert.triggeredAt);
    
    if (!searchQuery.trim()) return activeAlerts;

    const query = searchQuery.toLowerCase();
    return activeAlerts.filter(alert => 
      alert.coinName?.toLowerCase().includes(query) ||
      alert.coinSymbol?.toLowerCase().includes(query) ||
      alert.coinId.toLowerCase().includes(query)
    );
  }, [alerts, searchQuery]);

  const handleCreateSuccess = () => {
    fetchAlerts();
  };

  const handleEditSuccess = () => {
    fetchAlerts();
  };

  const handleDeleteClick = (alert: PriceAlert) => {
    setDeletingAlert(alert);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAlert) return;

    try {
      const deletePromise = alertsApi.deleteAlert(deletingAlert._id);

      toast.promise(
        deletePromise,
        {
          loading: 'Đang xóa cảnh báo...',
          success: `Đã xóa cảnh báo cho ${deletingAlert.coinName || deletingAlert.coinId}`,
          error: 'Không thể xóa cảnh báo',
        }
      );

      await deletePromise;
      setDeletingAlert(null);
      fetchAlerts();
    } catch {
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quản lý cảnh báo giá</h1>
          <p className="text-gray-400">Theo dõi và quản lý các cảnh báo giá cryptocurrency của bạn</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên coin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Create Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Tạo cảnh báo mới
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new price alert</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-400">
            Tìm thấy {filteredAlerts.length} kết quả
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white">Đang tải cảnh báo...</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-600/50">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'Không tìm thấy cảnh báo' : 'Chưa có cảnh báo'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery 
                ? 'Thử tìm kiếm với từ khóa khác' 
                : 'Thiết lập cảnh báo giá để không bỏ lỡ cơ hội đầu tư'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all"
              >
                <Plus className="w-5 h-5" />
                Tạo cảnh báo đầu tiên
              </button>
            )}
          </div>
        ) : (
          /* Alerts List - One per row */
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4 pr-4">
              {filteredAlerts.map((alert) => (
              <div
                key={alert._id}
                className="group relative bg-gray-800 rounded-lg p-5 border border-gray-600/50 hover:border-primary-500/40 transition-all"
              >
                {/* Active Indicator */}
                <div className="absolute top-5 right-5 w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>

                <div className="flex items-center gap-4">
                  {/* Coin Image */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    {alert.coinImage ? (
                      <Image
                        src={alert.coinImage}
                        alt={alert.coinName || alert.coinId}
                        width={48}
                        height={48}
                        className="rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(alert.coinSymbol || alert.coinId).toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Alert Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white truncate">
                        {alert.coinName || alert.coinId}
                      </h4>
                      <span className="px-2 py-0.5 text-xs font-medium text-gray-300 bg-gray-700 rounded">
                        {(alert.coinSymbol || alert.coinId).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        alert.condition === 'above'
                          ? 'bg-success-500/20 text-success-500'
                          : 'bg-danger-500/20 text-danger-500'
                      }`}>
                        {alert.condition === 'above' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span className="text-xs font-medium">
                          {alert.condition === 'above' ? 'Vượt lên' : 'Giảm xuống'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        ${formatNumber(alert.targetPrice)}
                      </span>
                      <span className="text-xs text-gray-400">
                        • Tạo lúc: {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <TooltipProvider>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setEditingAlert(alert)}
                            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-500/20 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit this alert</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDeleteClick(alert)}
                            className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-500/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete this alert</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Modals */}
      <PriceAlertModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          handleCreateSuccess();
        }}
      />

      {editingAlert && (
        <EditAlertModal
          isOpen={!!editingAlert}
          onClose={() => setEditingAlert(null)}
          alert={editingAlert}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-card border border-gray-600/50 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Xác nhận xóa</h3>
            <p className="text-gray-300 mb-6">
              Bạn có chắc chắn muốn xóa cảnh báo cho{' '}
              <span className="font-semibold text-white">
                {deletingAlert.coinName || deletingAlert.coinId}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingAlert(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-700 rounded-lg text-gray-300 bg-dark-700 hover:bg-dark-600 hover:border-gray-600 transition-all font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg text-white bg-danger-500 hover:bg-danger-600 transition-all font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
