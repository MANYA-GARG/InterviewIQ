export const Tabs = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  variant = 'default',
}) => {
  const variantClasses = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'px-4 py-3 font-medium text-sm border-b-2 transition-colors',
      active: 'border-blue-600 text-blue-600',
      inactive: 'border-transparent text-gray-600 hover:text-gray-900',
    },
    pills: {
      container: 'gap-2',
      tab: 'px-4 py-2 font-medium text-sm rounded-lg transition-colors',
      active: 'bg-blue-600 text-white',
      inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
  };

  const classes = variantClasses[variant] || variantClasses.default;

  return (
    <div>
      {/* Tab List */}
      <div className={`flex ${classes.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${classes.tab} ${
              activeTab === tab.id ? classes.active : classes.inactive
            }`}
          >
            {tab.icon && <tab.icon className="h-4 w-4 inline mr-2" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.map((tab) => (
          activeTab === tab.id && (
            <div key={tab.id}>
              {tab.content}
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default Tabs;
