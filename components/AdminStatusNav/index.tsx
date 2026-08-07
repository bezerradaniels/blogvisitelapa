import Link from 'next/link';

interface AdminStatusItem {
  label: string;
  value: string;
  count?: number;
}

interface AdminStatusNavProps {
  items: AdminStatusItem[];
  current: string;
  basePath: string;
  paramName?: string;
}

export default function AdminStatusNav({ items, current, basePath, paramName = 'filtro' }: AdminStatusNavProps) {
  return (
    <ul className="admin-status-links text-[13px]" aria-label="Filtrar por status">
      {items.map((item) => {
        const query = new URLSearchParams();
        if (item.value && item.value !== 'todos' && item.value !== 'todas') query.set(paramName, item.value);
        const href = query.size ? `${basePath}?${query.toString()}` : basePath;
        return (
          <li key={item.value}>
            <Link href={href} aria-current={item.value === current ? 'page' : undefined}>
              {item.label}{typeof item.count === 'number' ? <span className="text-[#646970]"> ({item.count})</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
