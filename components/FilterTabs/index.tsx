import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface Tab {
  label: string;
  value: string;
}

interface FilterTabsProps {
  tabs: Tab[];
  current: string;
  basePath: string;
  paramName?: string;
}

// Abas de filtro baseadas em querystring (sem estado no cliente).
export default function FilterTabs({ tabs, current, basePath, paramName = 'filtro' }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line pb-2">
      {tabs.map((tab) => {
        const active = tab.value === current;
        const href = tab.value ? `${basePath}?${paramName}=${tab.value}` : basePath;
        return (
          <Link
            key={tab.value}
            href={href}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium',
              active ? 'bg-brand text-white' : 'text-body hover:bg-surface',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
