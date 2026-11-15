import { Inbox } from 'lucide-react';

export const EmptyState = ({ 
  message = "No data available",
  description = "Start by creating something new",
  icon: Icon = Inbox,
  cta = null,
  ctaLabel = "Get Started",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        <Icon className="h-8 w-8 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 text-center">{message}</h3>
      <p className="text-sm text-gray-600 mt-2 text-center max-w-md">{description}</p>
      {cta && (
        <button
          onClick={cta}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
