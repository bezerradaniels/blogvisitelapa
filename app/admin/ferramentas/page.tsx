import AdminPageHeader from '@/components/AdminPageHeader';
import { adminGuard } from '@/lib/auth/adminGuard';

export const dynamic = 'force-dynamic';

export default async function AdminToolsPage() {
  const ctx = await adminGuard();
  const { error } = ctx
    ? await ctx.supabase.from('settings').select('key', { head: true }).limit(1)
    : { error: new Error('Acesso restrito') };

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Ferramentas" description="Diagnóstico operacional seguro do ConectaLapa CMS." />
      <section className="admin-management-surface">
        <div className="border-b border-[#dcdcde] px-3 py-2"><h2 className="admin-section-title">Saúde do sistema</h2></div>
        <dl className="grid sm:grid-cols-2">
          <div className="border-b border-[#dcdcde] px-3 py-2 sm:border-r"><dt className="text-xs text-[#646970]">Aplicação</dt><dd className="font-medium">ConectaLapa CMS 1.0.0</dd></div>
          <div className="border-b border-[#dcdcde] px-3 py-2"><dt className="text-xs text-[#646970]">Ambiente</dt><dd className="font-medium">{process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}</dd></div>
          <div className="border-b border-[#dcdcde] px-3 py-2 sm:border-r sm:border-b-0"><dt className="text-xs text-[#646970]">Runtime</dt><dd className="font-medium">Node.js {process.versions.node}</dd></div>
          <div className="px-3 py-2"><dt className="text-xs text-[#646970]">Banco de dados</dt><dd className={error ? 'font-medium text-[#b32d2e]' : 'font-medium text-[#008a20]'}>{error ? 'Indisponível' : 'Conectado'}</dd></div>
        </dl>
      </section>
      <div className="admin-notice"><p><strong>Segurança:</strong> credenciais, tokens e variáveis secretas não são exibidos nesta página.</p></div>
    </div>
  );
}
