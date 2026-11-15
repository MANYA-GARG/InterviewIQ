import { ArrowUpRight, ArrowDownLeft, Minus } from 'lucide-react';

export const StatCard = ({ title, value, metric = '', trend = null, icon: Icon, className = '' }) => {
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownLeft : Minus;

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {metric && <p className="text-xs text-gray-500 mt-1">{metric}</p>}
        </div>
        {Icon && (
          <div className="bg-indigo-100 p-3 rounded-lg">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
        )}
      </div>
      {trend !== null && (
        <div className={`flex items-center gap-1 mt-4 ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{Math.abs(trend)}% {trend > 0 ? 'up' : trend < 0 ? 'down' : 'same'}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
