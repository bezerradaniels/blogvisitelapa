import Link from 'next/link';

interface DashboardMetricCardProps {
  label: string;
  value: number | string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  href: string;
}

// Tom → cor do número + cor do blob decorativo.
const numberColor: Record<string, string> = {
  default: 'text-title',
  success: 'text-[#1d7a58]',
  warning: 'text-[#b5822a]',
  danger: 'text-[#c74354]',
};
const blobColor: Record<string, string> = {
  default: '#f8f9fa',
  success: '#c9f2df',
  warning: '#fdeed2',
  danger: '#fbe0e3',
};

// Cartão de métrica do dashboard, com blob decorativo atrás do número.
export default function DashboardMetricCard({ label, value, href, tone = 'default' }: DashboardMetricCardProps) {
  return (
    <Link
      href={href}
      aria-label={`Ver detalhes de ${label}`}
      className="card-base card-hover group relative block overflow-hidden p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="metric-blob" style={{ background: blobColor[tone] }} aria-hidden />
      <p className="relative z-10 text-xs font-bold text-muted">{label}</p>
      <p className={`relative z-10 mt-1 font-headline text-[34px] font-extrabold leading-none ${numberColor[tone]}`}>
        {value}
      </p>
      <span className="relative z-10 mt-3 inline-flex text-[11px] font-bold text-brand transition-transform group-hover:translate-x-0.5">
        Ver detalhes →
      </span>
    </Link>
  );
}
