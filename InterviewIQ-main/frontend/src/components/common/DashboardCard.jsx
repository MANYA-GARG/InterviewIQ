export const DashboardCard = ({
  title,
  description,
  cta,
  icon: Icon,
  onClick,
  color = 'blue',
}) => {
  const colorMap = {
    blue: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-100',
      icon: 'bg-blue-100 text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    green: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-100',
      icon: 'bg-green-100 text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
    },
    purple: {
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-100',
      icon: 'bg-purple-100 text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}
    >
      {/* Icon */}
      <div className={`inline-flex rounded-lg p-3 ${colors.icon}`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="mt-5 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>

      {/* CTA Button */}
      <button
        onClick={onClick}
        className={`mt-6 inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${colors.button}`}
      >
        {cta}
        <span className="ml-2">→</span>
      </button>
    </div>
  );
};

export default DashboardCard;
