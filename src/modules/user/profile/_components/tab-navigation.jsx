import { cn } from '@/src/lib/utils';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'post', icon: 'fa-table-cells', label: 'POST' },
    { id: 'postIsPrivate', icon: 'fa-lock', label: 'PRIVATE' },
    { id: 'reel', icon: 'fa-film', label: 'REEL' },
    { id: 'saved', icon: 'fa-bookmark', label: 'SAVED' },
  ];

  return (
    <div className="flex justify-center space-x-12">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            'flex items-center py-3 text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'border-t-2 border-neutral-800 text-neutral-900 dark:border-white dark:text-white'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
          )}
          onClick={() => onTabChange(tab.id)}
        >
          <i className={`fa-solid ${tab.icon} mr-2`}></i>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
