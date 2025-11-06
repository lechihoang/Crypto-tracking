import React from 'react';
import { BarChart3, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardStat } from '@/types';

interface DashboardStatsProps {
  stats?: DashboardStat[];
}

const defaultStats: DashboardStat[] = [
  {
    title: 'Tổng giá trị danh mục',
    value: '$0.00',
    change: '+0.00%',
    changeType: 'positive',
    icon: Wallet,
  },
  {
    title: 'Lợi nhuận/Lỗ hôm nay',
    value: '$0.00',
    change: '+0.00%',
    changeType: 'positive',
    icon: TrendingUp,
  },
  {
    title: 'Số đồng coin trong danh mục',
    value: '0',
    change: '',
    changeType: 'neutral',
    icon: BarChart3,
  },
  {
    title: 'Cảnh báo đang hoạt động',
    value: '0',
    change: '',
    changeType: 'neutral',
    icon: AlertCircle,
  },
];

const DashboardStats = React.memo(function DashboardStats({ stats = defaultStats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change && (
                <p className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'negative' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${
              stat.changeType === 'positive' ? 'bg-green-100' :
              stat.changeType === 'negative' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              <stat.icon className={`w-6 h-6 ${
                stat.changeType === 'positive' ? 'text-green-600' :
                stat.changeType === 'negative' ? 'text-red-600' :
                'text-blue-600'
              }`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;