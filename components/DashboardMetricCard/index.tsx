interface DashboardMetricCardProps {
  label: string;
  value: number | string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

// Tom → cor do número + cor do blob decorativo.
const numberColor: Record<string, string> = {
  default: 'text-title',
  success: 'text-[#1d7a58]',
  warning: 'text-[#b5822a]',
  danger: 'text-[#c74354]',
};
const blobColor: Record<string, string> = {
  default: '#def3e8',
  success: '#c9f2df',
  warning: '#fdeed2',
  danger: '#fbe0e3',
};

// Cartão de métrica do dashboard, com blob decorativo atrás do número.
export default function DashboardMetricCard({ label, value, tone = 'default' }: DashboardMetricCardProps) {
  return (
    <div className="card-base card-hover relative overflow-hidden p-4">
      <span className="metric-blob" style={{ background: blobColor[tone] }} aria-hidden />
      <p className="relative z-10 text-xs font-bold text-muted">{label}</p>
      <p className={`relative z-10 mt-1 font-headline text-[34px] font-extrabold leading-none ${numberColor[tone]}`}>
        {value}
      </p>
    </div>
  );
}
