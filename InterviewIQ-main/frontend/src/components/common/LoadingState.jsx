import { Loader } from 'lucide-react';

export const LoadingState = ({ 
  message = "Loading...",
  subMessage = "",
  showSpinner = true,
  size = "md"
}) => {
  const spinnerSizeMap = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {showSpinner && (
        <Loader className={`${spinnerSizeMap[size]} animate-spin text-blue-600 mb-4`} />
      )}
      <h3 className="text-lg font-semibold text-gray-900 text-center">{message}</h3>
      {subMessage && (
        <p className="text-sm text-gray-600 mt-2 text-center max-w-md">{subMessage}</p>
      )}
    </div>
  );
};

export default LoadingState;
