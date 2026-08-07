import Link from 'next/link';

interface DashboardMetricCardProps {
  label: string;
  value: number | string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  href: string;
}

// Tom → cor do número no painel compacto.
const numberColor: Record<string, string> = {
  default: 'text-title',
  success: 'text-[#1d7a58]',
  warning: 'text-[#b5822a]',
  danger: 'text-[#c74354]',
};
export default function DashboardMetricCard({ label, value, href, tone = 'default' }: DashboardMetricCardProps) {
  return (
    <Link
      href={href}
      aria-label={`Ver detalhes de ${label}`}
      className="admin-dashboard-stat group block border border-[#c3c4c7] bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2271b1]"
    >
      <p className="text-xs font-semibold text-[#50575e]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold leading-none ${numberColor[tone]}`}>
        {value}
      </p>
      <span className="mt-2 inline-flex text-xs font-medium text-[#2271b1] group-hover:text-[#135e96]">
        Ver detalhes →
      </span>
    </Link>
  );
}
