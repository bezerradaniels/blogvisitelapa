import Button from '@/components/Button';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { getAdminMetrics } from '@/features/admin/metrics';
import { getCurrentUser } from '@/lib/auth/session';
import { formatDate, titleCase } from '@/lib/utils/format';

// Visão geral do admin com métricas consolidadas (função guardada por RLS/admin).
export const dynamic = 'force-dynamic';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default async function AdminHomePage() {
  const [m, user] = await Promise.all([getAdminMetrics(), getCurrentUser()]);
  const firstName = titleCase(user?.profile?.full_name?.split(' ')[0]) || 'Admin';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-title md:text-[26px]">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm font-semibold text-muted">
            {formatDate(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")} · visão geral
          </p>
        </div>
        <Button href="/admin/posts/novo">+ Novo post</Button>
      </header>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Conteúdo</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Total de posts" value={m.total_posts} href="/admin/posts" />
          <DashboardMetricCard label="Publicados" value={m.published_posts} href="/admin/posts?filtro=publicados" tone="success" />
          <DashboardMetricCard label="Rascunhos" value={m.draft_posts} href="/admin/posts?filtro=rascunhos" />
          <DashboardMetricCard label="Aguardando revisão" value={m.pending_posts} href="/admin/posts?filtro=pendentes" tone="warning" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Comunidade</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Usuários" value={m.total_users} href="/admin/usuarios" />
          <DashboardMetricCard label="Publishers" value={m.total_publishers} href="/admin/usuarios" />
          <DashboardMetricCard label="Comentários pendentes" value={m.pending_comments} href="/admin/comentarios" tone="warning" />
          <DashboardMetricCard label="Novos contatos" value={m.recent_contacts} href="/admin/contatos" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Publicidade</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Contratos ativos" value={m.active_contracts} href="/admin/comercial/contratos?status=ativo" tone="success" />
          <DashboardMetricCard label="Vencendo (7 dias)" value={m.expiring_contracts} href="/admin/comercial/contratos?status=vencendo" tone="warning" />
          <DashboardMetricCard label="Expirados" value={m.expired_contracts} href="/admin/comercial/contratos?status=expirado" tone="danger" />
          <DashboardMetricCard label="Leads de anunciantes" value={m.recent_leads} href="/admin/comercial/leads" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Patrocínios</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardMetricCard label="Posts patrocinados" value={m.sponsored_posts} href="/admin/comercial/conteudo?tipo=artigo" />
          <DashboardMetricCard label="Eventos patrocinados" value={m.sponsored_events} href="/admin/comercial/conteudo?tipo=evento" />
        </div>
      </section>
    </div>
  );
}
