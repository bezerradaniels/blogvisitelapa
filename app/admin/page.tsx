import Link from 'next/link';
import AdminPageHeader from '@/components/AdminPageHeader';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { getAdminMetrics } from '@/features/admin/metrics';
import { listAdminPosts } from '@/features/admin/queries';
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
  const [m, user, recent] = await Promise.all([getAdminMetrics(), getCurrentUser(), listAdminPosts({ pageSize: 6 })]);
  const firstName = titleCase(user?.profile?.full_name?.split(' ')[0]) || 'Admin';

  return (
    <div className="admin-page space-y-5">
      <AdminPageHeader title="Painel" actionHref="/admin/posts/novo" actionLabel="Adicionar artigo" description={`${greeting()}, ${firstName}. ${formatDate(new Date(), "EEEE, d 'de' MMMM 'de' yyyy")}.`} />

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Conteúdo</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <DashboardMetricCard label="Total de posts" value={m.total_posts} href="/admin/posts" />
          <DashboardMetricCard label="Publicados" value={m.published_posts} href="/admin/posts?filtro=publicados" tone="success" />
          <DashboardMetricCard label="Rascunhos" value={m.draft_posts} href="/admin/posts?filtro=rascunhos" />
          <DashboardMetricCard label="Aguardando revisão" value={m.pending_posts} href="/admin/posts?filtro=pendentes" tone="warning" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Comunidade</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <DashboardMetricCard label="Usuários" value={m.total_users} href="/admin/usuarios" />
          <DashboardMetricCard label="Editores" value={m.total_publishers} href="/admin/usuarios?papel=publisher" />
          <DashboardMetricCard label="Comentários pendentes" value={m.pending_comments} href="/admin/comentarios" tone="warning" />
          <DashboardMetricCard label="Novos contatos" value={m.recent_contacts} href="/admin/contatos" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Publicidade</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <DashboardMetricCard label="Contratos ativos" value={m.active_contracts} href="/admin/comercial/contratos?status=ativo" tone="success" />
          <DashboardMetricCard label="Vencendo (7 dias)" value={m.expiring_contracts} href="/admin/comercial/contratos?status=vencendo" tone="warning" />
          <DashboardMetricCard label="Expirados" value={m.expired_contracts} href="/admin/comercial/contratos?status=expirado" tone="danger" />
          <DashboardMetricCard label="Leads de anunciantes" value={m.recent_leads} href="/admin/comercial/leads" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-title">Patrocínios</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <DashboardMetricCard label="Posts patrocinados" value={m.sponsored_posts} href="/admin/comercial/conteudo?tipo=artigo" />
          <DashboardMetricCard label="Eventos patrocinados" value={m.sponsored_events} href="/admin/comercial/conteudo?tipo=evento" />
        </div>
      </section>

      <section className="admin-management-surface">
        <div className="flex items-center justify-between border-b border-[#dcdcde] px-3 py-2">
          <h2 className="admin-section-title">Atividade recente</h2>
          <Link href="/admin/posts" className="admin-link text-xs">Ver todos os posts</Link>
        </div>
        <ul className="divide-y divide-[#dcdcde]">
          {recent.posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <Link href={`/admin/posts/${post.id}/editar`} className="admin-link font-medium">{post.title}</Link>
              <span className="text-xs text-[#646970]">{formatDate(post.updated_at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
