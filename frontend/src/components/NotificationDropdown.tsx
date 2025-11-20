'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { alertsApi } from '@/lib/api';
import { Alert } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// LocalStorage keys
const STORAGE_KEY = 'notification_count';

// Toast notification utility functions
const formatToastMessage = (count: number): string => {
  if (count === 1) {
    return '1 cảnh báo vừa được thực hiện, xem thông báo để biết chi tiết';
  }
  return `${count} cảnh báo vừa được thực hiện, xem thông báo để biết chi tiết`;
};

const showAlertToast = (count: number, onClickHandler: () => void) => {
  try {
    const message = formatToastMessage(count);
    toast.info(message, {
      duration: 5000,
      action: {
        label: 'Xem',
        onClick: () => {
          try {
            onClickHandler();
          } catch (error) {
          }
        },
      },
    });
  } catch (error) {
  }
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [previousAlertIds, setPreviousAlertIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setUnviewedCount(data.count || 0);
        setPreviousAlertIds(new Set(data.alertIds || []));
      }
    } catch (e) {
    }
    
    // Initial load
    loadNotifications();
  }, []);

  // Handle click outside to close dropdown
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

  // Polling logic
  useEffect(() => {
    if (!isOpen) {
      // Start polling when dropdown is closed
      pollingIntervalRef.current = setInterval(() => {
        pollForNewAlerts();
      }, 30000); // 30 seconds
    } else {
      // Stop polling when dropdown is open
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen, previousAlertIds, unviewedCount]);

  const loadNotifications = async () => {
    setLoading(true);
    
    try {
      const response = await alertsApi.getTriggeredAlerts();
      if (response.data) {
        const newAlerts: Alert[] = response.data.map((alert) => ({
          _id: alert._id,
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
        }));
        
        setAlerts(newAlerts);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const pollForNewAlerts = async () => {
    try {
      const response = await alertsApi.getTriggeredAlerts();
      if (response.data) {
        const currentAlerts: Alert[] = response.data;
        const newCount = checkForNewAlerts(currentAlerts, previousAlertIds);
        
        if (newCount > 0) {
          const newUnviewedCount = unviewedCount + newCount;
          setUnviewedCount(newUnviewedCount);
          
          // Update previousAlertIds to include new alerts
          const allIds = new Set([...previousAlertIds, ...currentAlerts.map(a => a._id)]);
          setPreviousAlertIds(allIds);
          
          // Save to localStorage
          saveToLocalStorage(newUnviewedCount, Array.from(allIds));
          
          // Show toast notification (only if dropdown is closed)
          if (!isOpen) {
            showAlertToast(newCount, handleToastClick);
          }
        }
      }
    } catch (error) {
    }
  };

  const checkForNewAlerts = (currentAlerts: Alert[], previousIds: Set<string>): number => {
    const newAlerts = currentAlerts.filter(alert => !previousIds.has(alert._id));
    return newAlerts.length;
  };

  const saveToLocalStorage = (count: number, alertIds: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, alertIds }));
    } catch (e) {
    }
  };

  const handleToastClick = () => {
    // Open dropdown
    setIsOpen(true);
    
    // Reset count
    setUnviewedCount(0);
    
    // Load latest notifications
    loadNotifications();
    
    // Save current alert IDs after loading
    setTimeout(() => {
      const alertIds = alerts.map(a => a._id);
      setPreviousAlertIds(new Set(alertIds));
      saveToLocalStorage(0, alertIds);
    }, 500);
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      // Opening dropdown
      handleToastClick();
    } else {
      // Closing dropdown
      setIsOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Icon Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleToggleDropdown}
              className="relative p-2 rounded-lg hover:bg-dark-700 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-100" />
              {unviewedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
                  {unviewedCount > 9 ? '9+' : unviewedCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{unviewedCount > 0 ? `${unviewedCount} new notification${unviewedCount > 1 ? 's' : ''}` : 'Notifications'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-xl border border-gray-600 shadow-xl z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-600/50">
              <h3 className="text-lg font-semibold text-gray-50">Thông báo</h3>
            </div>

            {/* Notifications List - Scrollable */}
            <div className="max-h-[32rem] overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200/30 border-t-primary-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-100">Đang tải...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-50 font-medium">Không có thông báo mới</p>
                  <p className="text-sm text-gray-100 mt-1">
                    Cảnh báo giá sẽ xuất hiện ở đây
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-600/30">
                  {alerts.map((notification) => (
                    <div
                      key={notification._id}
                      className="px-4 py-3 hover:bg-dark-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-50 capitalize">
                          {notification.coinId.replace(/-/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-100 mt-1">
                          Giá {notification.condition === 'above' ? 'vượt' : 'xuống dưới'}{' '}
                          <span className="font-medium text-gray-50">
                            ${notification.targetPrice.toLocaleString()}
                          </span>
                          {notification.triggeredPrice && (
                            <span className="text-gray-100">
                              {' '}→ ${notification.triggeredPrice.toLocaleString()}
                            </span>
                          )}
                        </p>
                        {notification.triggeredAt && (
                          <p className="text-xs text-gray-100 mt-1">
                            {new Date(notification.triggeredAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
