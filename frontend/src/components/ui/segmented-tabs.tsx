import React from 'react'
import { cn } from '../../lib/utils'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface SegmentedTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export const SegmentedTabs: React.FC<SegmentedTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className
}) => {
  return (
    <div className={cn(
      "flex gap-2 rounded-xl border border-border/80 bg-background/60 p-1.5 shadow-sm backdrop-blur-sm",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 font-medium text-sm transition-all',
            activeTab === tab.id
              ? 'bg-white text-foreground shadow-[0_6px_16px_rgb(15_23_42_/_0.1)]'
              : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
          )}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
