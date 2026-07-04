interface DashboardMetricCardProps {
  label: string;
  value: number | string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

const tones = {
  default: 'text-title',
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
};

// Cartão de métrica do dashboard.
export default function DashboardMetricCard({ label, value, tone = 'default' }: DashboardMetricCardProps) {
  return (
    <div className="card-base p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
