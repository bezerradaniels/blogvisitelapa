import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import StatusBadge from '@/components/StatusBadge';
import ClientHistoryForm from '@/features/admin/ClientHistoryForm';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from('commercial_clients').select('*').eq('id', id).maybeSingle();
  if (!client) notFound();

  const { data: history } = await supabase
    .from('client_history')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <Link href="/admin/clientes-comerciais" className="text-sm text-brand hover:underline">
        ← Voltar
      </Link>

      <div className="card-base space-y-1 p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-title">{client.client_name}</h2>
          <StatusBadge status={client.status} />
        </div>
        {client.company_name && <p className="text-sm text-muted">{client.company_name}</p>}
        <p className="text-xs text-muted">
          {client.segment && `Segmento: ${client.segment}. `}
          {client.email && `${client.email}. `}
          {client.whatsapp && `${client.whatsapp}.`}
        </p>
        {client.notes && <p className="mt-2 text-sm text-body">{client.notes}</p>}
      </div>

      <ClientHistoryForm clientId={id} />

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-title">Histórico</h3>
        {(history ?? []).length === 0 ? (
          <p className="text-sm text-muted">Nenhum registro ainda.</p>
        ) : (
          (history ?? []).map((h) => (
            <div key={h.id} className="card-base p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                <Badge tone="neutral">{h.entry_type}</Badge>
                <time dateTime={h.created_at}>{formatDateTime(h.created_at)}</time>
              </div>
              {h.title && <p className="text-sm font-medium text-title">{h.title}</p>}
              {h.content && <p className="text-sm text-body">{h.content}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
