export const ScoreCircle = ({ score = 0, size = 'md', label = 'Score' }) => {
  const getColor = (score) => {
    if (score >= 70) return { bg: 'bg-green-100', text: 'text-green-600', ring: 'from-green-400 to-green-600' };
    if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-600', ring: 'from-yellow-400 to-yellow-600' };
    return { bg: 'bg-red-100', text: 'text-red-600', ring: 'from-red-400 to-red-600' };
  };

  const sizeClass = {
    sm: 'h-20 w-20',
    md: 'h-28 w-28',
    lg: 'h-40 w-40',
  };

  const textSize = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`${sizeClass[size]} ${color.bg} rounded-full flex items-center justify-center relative shadow-lg`}>
        <div className="absolute inset-0 rounded-full opacity-20" style={{
          background: `conic-gradient(from 0deg, #4f46e5 0deg, #4f46e5 ${score * 3.6}deg, transparent ${score * 3.6}deg)`
        }} />
        <div className={`${color.text} ${textSize[size]} font-bold`}>
          {Math.round(score)}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-xs font-semibold ${color.text}`}>
        {score >= 70 ? '⭐ Excellent' : score >= 40 ? '👍 Good' : '⚠️ Needs Work'}
      </p>
    </div>
  );
};

export default ScoreCircle;
