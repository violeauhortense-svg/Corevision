import React from 'react';

interface MetricsCardProps {
  icon: string;
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal';
  onClick?: () => void;
}

const colorStyles = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', number: 'text-blue-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', number: 'text-green-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', number: 'text-orange-600' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', number: 'text-red-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', number: 'text-purple-600' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', number: 'text-teal-600' }
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color = 'blue',
  onClick
}) => {
  const styles = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`${styles.bg} border-2 ${styles.border} rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105 min-h-32 flex flex-col items-center justify-center gap-2 text-center`}
    >
      <div className="text-3xl">{icon}</div>
      <h3 className={`text-xs font-bold uppercase tracking-wide ${styles.text}`}>{title}</h3>
      <div className={`text-2xl font-bold ${styles.number}`}>{value}</div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
};
