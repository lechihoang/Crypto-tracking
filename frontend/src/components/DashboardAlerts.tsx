'use client';

import Link from 'next/link';
import { Plus, AlertCircle, TrendingUp, TrendingDown, Trash2, Bell } from 'lucide-react';
import { formatNumber } from '@/utils/formatPrice';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Alert {
  id: string;
  coinId: number;
  coinSymbol: string;
  coinName: string;
  coinImage?: string;
  condition: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
}

interface DashboardAlertsProps {
  alerts: Alert[];
  onDeleteAlert: (alertId: string) => Promise<void>;
}

export default function DashboardAlerts({ alerts, onDeleteAlert }: DashboardAlertsProps) {
  const activeAlerts = alerts.filter(alert => alert.isActive);

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cảnh báo giá</h3>
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
            Tạo mới
          </Link>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Chưa có cảnh báo</h4>
          <p className="text-gray-600 mb-6">Thiết lập cảnh báo giá để không bỏ lỡ cơ hội đầu tư</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Tạo cảnh báo</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cảnh báo giá</h3>
        <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
          Tạo mới
        </Link>
      </div>

      <div className="space-y-3">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="group relative bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Coin Image */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  {alert.coinImage ? (
                    <Image
                      src={alert.coinImage}
                      alt={alert.coinName}
                      width={48}
                      height={48}
                      className="rounded-full shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-sm">
                        {alert.coinSymbol.toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Alert Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {alert.coinName}
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                      {alert.coinSymbol.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      alert.condition === 'above'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
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
                    <span className="text-sm font-semibold text-gray-900">
                      ${formatNumber(alert.targetPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={async () => {
                  const deletePromise = onDeleteAlert(alert.id);

                  toast.promise(
                    deletePromise,
                    {
                      loading: 'Đang xóa cảnh báo...',
                      success: `Đã xóa cảnh báo cho ${alert.coinName}`,
                      error: 'Không thể xóa cảnh báo',
                    }
                  );
                }}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Xóa cảnh báo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Active Indicator */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        ))}

        <Link
          href="/"
          className="block text-center py-3 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors hover:bg-gray-50 rounded-lg"
        >
          Xem tất cả ({activeAlerts.length}) →
        </Link>
      </div>
    </div>
  );
}
