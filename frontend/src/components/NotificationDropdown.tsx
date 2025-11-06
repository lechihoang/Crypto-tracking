'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { alertsApi } from '@/lib/api';
import { Alert } from '@/types';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await alertsApi.getTriggeredAlerts();
      if (response.data) {
        const alerts: Alert[] = response.data.map((alert) => ({
          id: alert.id,
          coinId: alert.coinId,
          coinSymbol: alert.coinSymbol,
          coinName: alert.coinName,
          coinImage: alert.coinImage,
          condition: alert.condition,
          targetPrice: alert.targetPrice,
          isActive: alert.isActive,
          triggeredPrice: alert.triggeredPrice,
          triggeredAt: alert.triggeredAt,
          createdAt: alert.createdAt,
          read: false,
        }));
        setAlerts(alerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };


  const unreadCount = alerts.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
          </div>

          {/* Notifications List - Scrollable */}
          <div className="max-h-[32rem] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Đang tải...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Không có thông báo mới</p>
                <p className="text-sm text-gray-500 mt-1">
                  Cảnh báo giá sẽ xuất hiện ở đây
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {alerts.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        notification.condition === 'above'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {notification.condition === 'above' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {notification.coinId.replace(/-/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Giá {notification.condition === 'above' ? 'vượt' : 'xuống dưới'}{' '}
                          <span className="font-medium">
                            ${notification.targetPrice.toLocaleString()}
                          </span>
                          {notification.triggeredPrice && (
                            <span className="text-gray-500">
                              {' '}→ ${notification.triggeredPrice.toLocaleString()}
                            </span>
                          )}
                        </p>
                        {notification.triggeredAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.triggeredAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          
        </div>
      )}
    </div>
  );
}
