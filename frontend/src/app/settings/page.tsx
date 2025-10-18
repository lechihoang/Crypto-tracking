'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { alertsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import toast from 'react-hot-toast';

interface PriceAlert {
  id: string;
  coin_symbol: string;
  coin_name: string;
  condition: 'above' | 'below';
  target_price: number;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadAlerts();
    }
  }, [user, loading, router]);

  const loadAlerts = async () => {
    try {
      const response = await alertsApi.getAlerts();
      if (response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      await alertsApi.toggleAlert(alertId, isActive);
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, is_active: isActive } : alert
      ));
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const deletePromise = (async () => {
        await alertsApi.deleteAlert(alertId);
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      })();

      toast.promise(
        deletePromise,
        {
          loading: 'Đang xóa cảnh báo...',
          success: 'Đã xóa cảnh báo',
          error: 'Không thể xóa cảnh báo',
        }
      );

      await deletePromise;
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6 pt-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Hồ sơ
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'alerts'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Cảnh báo giá ({alerts.length})
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Thông báo
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Thông tin cá nhân
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Họ tên
                      </label>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        {user?.full_name || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>

                <ChangePasswordForm />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Cảnh báo giá cryptocurrency
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Quản lý các cảnh báo giá của bạn. Hệ thống sẽ gửi email thông báo khi giá đạt mức đã đặt.
                  </p>
                </div>

                {loadingAlerts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải cảnh báo...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm5 10V12h-4v5h4zM9 7V5h4v2H9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Chưa có cảnh báo nào
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Bạn chưa tạo cảnh báo giá nào. Hãy tạo cảnh báo để nhận thông báo khi giá thay đổi.
                    </p>
                    <button
                      onClick={() => router.push('/')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Tạo cảnh báo đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                {alert.coin_name} ({alert.coin_symbol.toUpperCase()})
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                alert.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {alert.is_active ? 'Hoạt động' : 'Đã tắt'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Cảnh báo khi giá {alert.condition === 'above' ? 'vượt' : 'xuống dưới'} ${alert.target_price.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              Tạo lúc: {new Date(alert.created_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleToggleAlert(alert.id, !alert.is_active)}
                              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                alert.is_active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                              }`}
                            >
                              {alert.is_active ? 'Tắt' : 'Bật'}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Cài đặt thông báo
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Email thông báo giá
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nhận email khi giá cryptocurrency đạt mức cảnh báo
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Thông báo bảo mật
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nhận thông báo về hoạt động đăng nhập và bảo mật
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Bản tin thị trường
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nhận email tổng quan thị trường hàng tuần
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Email liên hệ
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tất cả thông báo sẽ được gửi đến: <strong>{user?.email}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}