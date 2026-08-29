import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-xl border border-white/5">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-brand-600 text-white shadow-glow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5',
            ].join(' ')}
          >
            {tab.icon && <span className="opacity-80">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
