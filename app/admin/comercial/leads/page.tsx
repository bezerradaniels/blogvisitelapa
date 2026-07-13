import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import ContactStatusControl from '@/features/admin/ContactStatusControl';
import { deleteAdvertiser, setAdvertiserStatus } from '@/features/admin/contactsActions';
import { adminGuard } from '@/lib/auth/adminGuard';
import { formatDate } from '@/lib/utils/format';
import LeadConversionButton from '@/features/commercial/LeadConversionButton';

export const dynamic = 'force-dynamic';

export default async function ComercialLeadsPage() {
  const ctx = await adminGuard();
  if (!ctx) return null;

  const { data, error } = await ctx.supabase
    .from('advertiser_contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error('Não foi possível carregar os leads comerciais.');
  const leads = data ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-headline text-2xl font-extrabold text-title">Leads comerciais</h1>
        <p className="mt-1 text-sm text-muted">
          Contatos recebidos pela página pública “Anuncie”.
        </p>
      </header>

      {leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead recebido"
          description="Novos pedidos enviados pelo formulário comercial aparecerão aqui."
        />
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="card-base p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-title">{lead.name}</span>
                    {lead.company_name && <span className="text-sm text-muted">· {lead.company_name}</span>}
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-1 break-words text-xs text-muted">
                    {lead.email}
                    {lead.whatsapp && ` · ${lead.whatsapp}`}
                    {` · ${formatDate(lead.created_at)}`}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {lead.segment && `Segmento: ${lead.segment}. `}
                    {lead.ad_type && `Interesse: ${lead.ad_type}. `}
                    {lead.budget_range && `Orçamento: ${lead.budget_range}.`}
                  </p>
                  {lead.message && <p className="mt-2 whitespace-pre-line text-sm text-body">{lead.message}</p>}
                </div>
                <ContactStatusControl
                  id={lead.id}
                  status={lead.status}
                  onSetStatus={setAdvertiserStatus}
                  onDelete={deleteAdvertiser}
                />
                {lead.status !== 'concluido' && <LeadConversionButton leadId={lead.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
