import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ 
  message = "Something went wrong",
  description = "Please try again or contact support if the problem persists.",
  onRetry = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 rounded-full bg-red-100 mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 text-center">{message}</h3>
      <p className="text-sm text-red-700 mt-2 text-center max-w-md">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
