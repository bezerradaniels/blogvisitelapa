import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import ContactStatusControl from '@/features/admin/ContactStatusControl';
import { deleteContact, setContactStatus } from '@/features/admin/contactsActions';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function AdminContatosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  const contacts = data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Contatos</h2>
      {contacts.length === 0 ? (
        <EmptyState title="Nenhum contato recebido" />
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li key={c.id} className="card-base p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-title">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {c.email}
                    {c.whatsapp && ` · ${c.whatsapp}`}
                    {` · ${formatDate(c.created_at)}`}
                  </p>
                  {c.subject && <p className="mt-1 text-sm font-medium text-body">{c.subject}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-body">{c.message}</p>
                </div>
                <ContactStatusControl
                  id={c.id}
                  status={c.status}
                  onSetStatus={setContactStatus}
                  onDelete={deleteContact}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
