'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, TrendingDown, Trash2, Bell } from 'lucide-react';
import { formatNumber } from '@/utils/formatPrice';
import Image from 'next/image';
import { toast } from 'sonner';
import { Alert } from '@/types';
import PriceAlertModal from './PriceAlertModal';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DashboardAlertsProps {
  alerts: Alert[];
  onDeleteAlert: (alertId: string) => Promise<void>;
  onAlertCreated?: () => void;
}

const DashboardAlerts = React.memo(function DashboardAlerts({ alerts, onDeleteAlert, onAlertCreated }: DashboardAlertsProps) {
  const activeAlerts = useMemo(() => alerts.filter(alert => alert.isActive), [alerts]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const handleAlertModalClose = () => {
    setIsAlertModalOpen(false);
    if (onAlertCreated) {
      onAlertCreated();
    }
  };

  return (
    <TooltipProvider>
      <Card className="hover:shadow-lg transition-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Cảnh báo giá</h3>
          <Link href="/alerts" className="text-primary-500 hover:text-primary-600 text-sm font-semibold transition-colors">
            Xem chi tiết
          </Link>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Chưa có cảnh báo</h4>
            <p className="text-gray-300 mb-6">Thiết lập cảnh báo giá để không bỏ lỡ cơ hội đầu tư</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors bg-primary-500 hover:bg-primary-600"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Tạo cảnh báo</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new price alert</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {activeAlerts.map((alert) => (
              <div
                key={alert._id}
                className="group relative bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all border border-gray-600/30 hover:border-primary-500/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Coin Image */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {alert.coinImage ? (
                        <Image
                          src={alert.coinImage}
                          alt={alert.coinName || alert.coinId}
                          width={48}
                          height={48}
                          className="rounded-full shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">
                            {(alert.coinSymbol || alert.coinId).toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Alert Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">
                          {alert.coinName || alert.coinId}
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-300 bg-gray-800 rounded">
                          {(alert.coinSymbol || alert.coinId).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={async () => {
                          const deletePromise = onDeleteAlert(alert._id);

                          toast.promise(
                            deletePromise,
                            {
                              loading: 'Đang xóa cảnh báo...',
                              success: `Đã xóa cảnh báo cho ${alert.coinName || alert.coinId}`,
                              error: 'Không thể xóa cảnh báo',
                            }
                          );
                        }}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete this alert</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Active Indicator */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={handleAlertModalClose}
      />
    </TooltipProvider>
  );
});

DashboardAlerts.displayName = 'DashboardAlerts';

export default DashboardAlerts;
