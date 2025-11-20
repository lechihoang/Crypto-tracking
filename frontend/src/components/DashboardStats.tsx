import React from 'react';
import { BarChart3, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardStat } from '@/types';
import { Card } from '@/components/ui/card';

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
        <Card key={stat.title} className="hover:shadow-lg transition-shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              {stat.change && (
                <p className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-success-500' :
                  stat.changeType === 'negative' ? 'text-danger-500' :
                  'text-gray-300'
                }`}>
                  {stat.change}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${
              stat.changeType === 'positive' ? 'bg-success-500/20' :
              stat.changeType === 'negative' ? 'bg-danger-500/20' :
              'bg-primary-500/20'
            }`}>
              <stat.icon className={`w-6 h-6 ${
                stat.changeType === 'positive' ? 'text-success-500' :
                stat.changeType === 'negative' ? 'text-danger-500' :
                'text-primary-500'
              }`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats;