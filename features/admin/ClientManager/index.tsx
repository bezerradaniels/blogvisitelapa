'use client';

// Gestão de clientes comerciais: formulário (criar/editar) + lista.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import StatusBadge from '@/components/StatusBadge';
import { deleteClient, saveClient, type ClientInput } from '@/features/admin/clientsActions';

interface ClientRow {
  id: string;
  client_name: string;
  company_name: string | null;
  segment: string | null;
  email: string | null;
  whatsapp: string | null;
  document: string | null;
  notes: string | null;
  status: string;
}

const empty: ClientInput = {
  client_name: '', company_name: '', segment: '', email: '', whatsapp: '', document: '', notes: '', status: 'prospecto',
};

export default function ClientManager({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ClientInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function edit(c: ClientRow) {
    setForm({
      id: c.id,
      client_name: c.client_name,
      company_name: c.company_name ?? '',
      segment: c.segment ?? '',
      email: c.email ?? '',
      whatsapp: c.whatsapp ?? '',
      document: c.document ?? '',
      notes: c.notes ?? '',
      status: c.status as ClientInput['status'],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveClient(form);
      if (!res.ok) return setError(res.error ?? 'Erro.');
      setForm(empty);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm('Arquivar este cliente? Contratos e histórico serão preservados.')) return;
    start(async () => {
      const res = await deleteClient(id);
      if (!res.ok) return setError(res.error ?? 'Não foi possível arquivar o cliente.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="card-base space-y-3 p-4">
        <span className="text-sm font-bold text-title">{form.id ? 'Editar cliente' : 'Novo cliente'}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome do cliente" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          <Input label="Empresa" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          <Input label="Segmento" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} />
          <Input label="Documento (CPF/CNPJ)" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <Input label="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ClientInput['status'] })}
            options={[
              { value: 'prospecto', label: 'Prospecto' },
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
            ]}
          />
        </div>
        <Textarea label="Observações" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save}>{pending ? 'Salvando...' : form.id ? 'Salvar' : 'Criar cliente'}</Button>
          {form.id && <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button>}
        </div>
      </div>

      <div className="card-base overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Segmento</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="p-3">
                  <span className="font-medium text-title">{c.client_name}</span>
                  {c.company_name && <span className="block text-xs text-muted">{c.company_name}</span>}
                </td>
                <td className="p-3 text-muted">{c.segment ?? '—'}</td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
                <td className="p-3 text-right">
                  <Link href={`/admin/clientes-comerciais/${c.id}`} className="text-xs text-brand hover:underline">Histórico</Link>
                  <button onClick={() => edit(c)} className="ml-3 text-xs text-brand hover:underline">Editar</button>
                  <button onClick={() => remove(c.id)} className="ml-3 text-xs text-danger hover:underline">Arquivar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
