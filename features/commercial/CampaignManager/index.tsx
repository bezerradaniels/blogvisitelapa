'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import StatusBadge from '@/components/StatusBadge';
import { transitionCommercialCampaign } from '@/features/commercial/actions';
import type { CampaignListFilters, PagedCampaigns } from '@/features/commercial/queries';
import type { CommercialPlacementOption } from '@/features/commercial/types';
import { formatDateTime } from '@/lib/utils/format';

function nextCampaignAction(status: string): { label: string; status: string } | null {
  if (status === 'rascunho') return { label: 'Enviar para revisão', status: 'em_revisao' };
  if (status === 'aguardando_midia') return { label: 'Revisar', status: 'em_revisao' };
  if (status === 'em_revisao') return { label: 'Agendar', status: 'agendada' };
  if (status === 'agendada') return { label: 'Ativar', status: 'ativa' };
  if (status === 'ativa') return { label: 'Pausar', status: 'pausada' };
  if (status === 'pausada') return { label: 'Enviar para revisão', status: 'em_revisao' };
  return null;
}

function href(filters: CampaignListFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'todos') params.set('status', filters.status);
  if (filters.placement && filters.placement !== 'todos') params.set('placement', filters.placement);
  if (page > 1) params.set('pagina', String(page));
  return `/admin/comercial/campanhas${params.size ? `?${params}` : ''}`;
}

export default function CampaignManager({
  result,
  filters,
  placements,
}: {
  result: PagedCampaigns;
  filters: CampaignListFilters;
  placements: CommercialPlacementOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(id: string, status: string) {
    if (status === 'cancelada' && !window.confirm('Cancelar esta campanha? Ela deixará de ser exibida.')) return;
    setError(null);
    startTransition(async () => {
      const response = await transitionCommercialCampaign({ id, status });
      if (!response.ok) return setError(response.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-title">Campanhas e publicidade</h1>
          <p className="mt-1 text-sm text-muted">Operação dos criativos vinculados a contratos aprovados.</p>
        </div>
        <Button href="/admin/comercial/contratos/novo" size="sm">Criar contrato</Button>
      </div>

      <div className="rounded-[14px] border border-brand/25 bg-brand-soft/40 p-3 text-sm text-body">
        Campanhas são configuradas dentro de um contrato para manter cliente, período, mídia e recebíveis conectados.
      </div>

      <form method="get" className="card-base grid gap-3 p-4 sm:grid-cols-3">
        <Select id="campaign-status" name="status" label="Status" defaultValue={filters.status ?? 'todos'} options={[
          { value: 'todos', label: 'Todos' }, { value: 'rascunho', label: 'Rascunho' }, { value: 'aguardando_midia', label: 'Aguardando mídia' }, { value: 'em_revisao', label: 'Em revisão' }, { value: 'agendada', label: 'Agendada' }, { value: 'ativa', label: 'Ativa' }, { value: 'pausada', label: 'Pausada' }, { value: 'expirada', label: 'Expirada' }, { value: 'cancelada', label: 'Cancelada' },
        ]} />
        <Select id="campaign-placement" name="placement" label="Posição" defaultValue={filters.placement ?? 'todos'} options={[
          { value: 'todos', label: 'Todas' }, ...placements.map((placement) => ({ value: placement.code, label: placement.name })),
        ]} />
        <div className="flex items-end gap-2"><Button type="submit" size="sm">Filtrar</Button><Button href="/admin/comercial/campanhas" size="sm" variant="ghost">Limpar</Button></div>
      </form>

      {error && <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      {result.hasError && <p role="alert" className="rounded-[12px] bg-warning/10 px-3 py-2 text-sm text-body">Não foi possível carregar todas as referências de campanha.</p>}

      {result.rows.length === 0 ? (
        <EmptyState title="Nenhuma campanha encontrada" description="As campanhas aparecem aqui depois de configuradas dentro de um contrato." action={<Button href="/admin/comercial/contratos">Ver contratos</Button>} />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {result.rows.map((campaign) => {
              const action = nextCampaignAction(campaign.status);
              return <article key={campaign.id} className="card-base p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/admin/comercial/contratos/${campaign.contract_id}`} className="font-bold text-title hover:text-brand">{campaign.campaign_name}</Link><p className="mt-1 text-xs text-muted">{campaign.contract_number ?? campaign.contract_title} · {campaign.client_name}</p></div><StatusBadge status={campaign.status} /></div><p className="mt-3 text-sm text-muted">{campaign.placement} · até {formatDateTime(campaign.end_at)}</p><div className="mt-3 flex gap-2">{action && <Button type="button" size="sm" variant="outline" onClick={() => act(campaign.id, action.status)} disabled={pending}>{action.label}</Button>}{!['cancelada', 'expirada'].includes(campaign.status) && <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={() => act(campaign.id, 'cancelada')} disabled={pending}>Cancelar</Button>}</div></article>;
            })}
          </div>
          <div className="card-base hidden overflow-x-auto md:block"><table className="w-full min-w-[940px] text-sm"><thead className="bg-surface text-left text-xs text-muted"><tr><th className="p-3">Campanha</th><th className="p-3">Contrato / cliente</th><th className="p-3">Posição</th><th className="p-3">Período</th><th className="p-3">Status</th><th className="p-3" /></tr></thead><tbody className="divide-y divide-line">{result.rows.map((campaign) => { const action = nextCampaignAction(campaign.status); return <tr key={campaign.id}><td className="p-3"><Link href={`/admin/comercial/contratos/${campaign.contract_id}`} className="font-bold text-title hover:text-brand hover:underline">{campaign.campaign_name}</Link><span className="mt-0.5 block text-xs text-muted">{campaign.desktop_media_url ? 'Mídia enviada' : 'Sem mídia desktop'}</span></td><td className="p-3 text-body">{campaign.contract_number ?? campaign.contract_title}<span className="block text-xs text-muted">{campaign.client_name}</span></td><td className="p-3 text-muted">{campaign.placement}</td><td className="p-3 text-xs text-muted">{formatDateTime(campaign.start_at)}<br />até {formatDateTime(campaign.end_at)}</td><td className="p-3"><StatusBadge status={campaign.status} /></td><td className="p-3 text-right whitespace-nowrap">{action && <Button type="button" size="sm" variant="outline" onClick={() => act(campaign.id, action.status)} disabled={pending}>{action.label}</Button>}{!['cancelada', 'expirada'].includes(campaign.status) && <Button type="button" size="sm" variant="ghost" className="ml-1 text-danger" onClick={() => act(campaign.id, 'cancelada')} disabled={pending}>Cancelar</Button>}</td></tr>; })}</tbody></table></div>
        </>
      )}

      {result.pageCount > 1 && <nav className="flex items-center justify-center gap-2"><Button href={href(filters, Math.max(1, result.page - 1))} size="sm" variant="outline" aria-disabled={result.page === 1}>Anterior</Button><span className="text-sm text-muted">Página {result.page} de {result.pageCount}</span><Button href={href(filters, Math.min(result.pageCount, result.page + 1))} size="sm" variant="outline" aria-disabled={result.page === result.pageCount}>Próxima</Button></nav>}
    </div>
  );
}
