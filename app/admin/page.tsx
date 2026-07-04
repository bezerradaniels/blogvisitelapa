import DashboardMetricCard from '@/components/DashboardMetricCard';
import { createClient } from '@/lib/supabase/server';

// Visão geral do admin com métricas consolidadas (função guardada por RLS/admin).
export const dynamic = 'force-dynamic';

interface Metrics {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  pending_posts: number;
  total_users: number;
  total_publishers: number;
  pending_comments: number;
  active_contracts: number;
  expiring_contracts: number;
  expired_contracts: number;
  sponsored_posts: number;
  sponsored_events: number;
  recent_contacts: number;
  recent_leads: number;
}

export default async function AdminHomePage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc('admin_metrics_guarded');
  const m = (data ?? {}) as Partial<Metrics>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-base font-bold text-title">Conteúdo</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Total de posts" value={m.total_posts ?? 0} />
          <DashboardMetricCard label="Publicados" value={m.published_posts ?? 0} tone="success" />
          <DashboardMetricCard label="Rascunhos" value={m.draft_posts ?? 0} />
          <DashboardMetricCard label="Aguardando revisão" value={m.pending_posts ?? 0} tone="warning" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Comunidade</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Usuários" value={m.total_users ?? 0} />
          <DashboardMetricCard label="Publishers" value={m.total_publishers ?? 0} />
          <DashboardMetricCard label="Comentários pendentes" value={m.pending_comments ?? 0} tone="warning" />
          <DashboardMetricCard label="Novos contatos" value={m.recent_contacts ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Publicidade</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Contratos ativos" value={m.active_contracts ?? 0} tone="success" />
          <DashboardMetricCard label="Vencendo (7 dias)" value={m.expiring_contracts ?? 0} tone="warning" />
          <DashboardMetricCard label="Expirados" value={m.expired_contracts ?? 0} tone="danger" />
          <DashboardMetricCard label="Leads de anunciantes" value={m.recent_leads ?? 0} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Patrocínios</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Posts patrocinados" value={m.sponsored_posts ?? 0} />
          <DashboardMetricCard label="Eventos patrocinados" value={m.sponsored_events ?? 0} />
        </div>
      </section>
    </div>
  );
}
