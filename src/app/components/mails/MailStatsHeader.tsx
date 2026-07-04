import { Card } from '../ui/card';
import { Mail, Send, Inbox, TrendingUp, Clock, FileText } from 'lucide-react';
import type { MailStats } from '../../types/mail';

interface MailStatsHeaderProps {
  stats: MailStats;
  loading: boolean;
}

export function MailStatsHeader({ stats, loading }: MailStatsHeaderProps) {
  const statCards = [
    {
      label: 'Emails envoyés',
      value: stats.totalSent,
      icon: Send,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Emails reçus',
      value: stats.totalReceived,
      icon: Inbox,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
    },
    {
      label: 'Non lus',
      value: stats.unreadCount,
      icon: Mail,
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100',
      highlight: stats.unreadCount > 0,
    },
    {
      label: "Taux d'ouverture",
      value: `${stats.openRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
    },
    {
      label: 'Taux de réponse',
      value: `${stats.responseRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
    },
    {
      label: 'Temps de réponse',
      value: `${stats.avgResponseTime.toFixed(1)}h`,
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'from-cyan-50 to-cyan-100',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`p-4 relative overflow-hidden transition-all hover:shadow-lg ${
              stat.highlight ? 'ring-2 ring-red-500 shadow-lg' : ''
            }`}
          >
            <div
              className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.bgColor} opacity-20 rounded-full -mr-10 -mt-10`}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-600">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
