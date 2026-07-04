import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import ContactStatusControl from '@/features/admin/ContactStatusControl';
import { deleteAdvertiser, setAdvertiserStatus } from '@/features/admin/contactsActions';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function AdminAnunciantesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('advertiser_contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  const leads = data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Leads de anunciantes</h2>
      {leads.length === 0 ? (
        <EmptyState title="Nenhum lead recebido" />
      ) : (
        <ul className="space-y-2">
          {leads.map((l) => (
            <li key={l.id} className="card-base p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-title">{l.name}</span>
                    {l.company_name && <span className="text-sm text-muted">· {l.company_name}</span>}
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {l.email}
                    {l.whatsapp && ` · ${l.whatsapp}`}
                    {` · ${formatDate(l.created_at)}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {l.segment && `Segmento: ${l.segment}. `}
                    {l.ad_type && `Anúncio: ${l.ad_type}. `}
                    {l.budget_range && `Orçamento: ${l.budget_range}.`}
                  </p>
                  {l.message && <p className="mt-1 whitespace-pre-line text-sm text-body">{l.message}</p>}
                </div>
                <ContactStatusControl
                  id={l.id}
                  status={l.status}
                  onSetStatus={setAdvertiserStatus}
                  onDelete={deleteAdvertiser}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
