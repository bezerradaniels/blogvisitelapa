'use client';

// Formulário de contrato de publicidade (criar/editar).
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { saveContract, type ContractInput } from '@/features/admin/adActions';

interface ClientOption { id: string; client_name: string }

const placements = [
  { value: 'home_top', label: 'Home — topo' },
  { value: 'home_middle', label: 'Home — meio' },
  { value: 'home_carousel', label: 'Home — carrossel' },
  { value: 'post_sidebar', label: 'Post — sidebar' },
  { value: 'post_inline_mobile', label: 'Post — inline (mobile)' },
  { value: 'category_top', label: 'Categoria — topo' },
  { value: 'event_sidebar', label: 'Evento — sidebar' },
  { value: 'fixed_carousel_sponsor', label: 'Patrocínio do carrossel' },
];

export default function ContractForm({
  clients,
  initial,
}: {
  clients: ClientOption[];
  initial?: ContractInput;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ContractInput>(
    initial ?? {
      title: '', placement: 'home_top', start_date: '', end_date: '',
      payment_status: 'pendente', status: 'rascunho', priority: '0',
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set<K extends keyof ContractInput>(key: K, value: ContractInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await saveContract(form);
      if (!res.ok) return setError(res.error ?? 'Erro ao salvar.');
      router.push('/admin/contratos');
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="card-base space-y-3 p-4">
          <span className="text-sm font-bold text-title">Dados do anúncio</span>
          <Input label="Título do anúncio" value={form.title} onChange={(e) => set('title', e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Tipo de contrato" value={form.contract_type ?? ''} onChange={(e) => set('contract_type', e.target.value)} />
            <Input label="Tipo de anúncio" value={form.ad_type ?? ''} onChange={(e) => set('ad_type', e.target.value)} />
          </div>
          <Select label="Posição (placement)" value={form.placement} onChange={(e) => set('placement', e.target.value as ContractInput['placement'])} options={placements} />
          <ImageUploader bucket="ad-banners" value={form.banner_url || null} onChange={(url) => set('banner_url', url ?? '')} label="Banner (criativo)" ratio="aspect-[16/5]" />
          <Input label="URL de destino" value={form.link_url ?? ''} onChange={(e) => set('link_url', e.target.value)} placeholder="https://" />
        </div>

        <div className="card-base space-y-3 p-4">
          <span className="text-sm font-bold text-title">Cliente e período</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Cliente"
              value={form.client_id ?? ''}
              onChange={(e) => set('client_id', e.target.value)}
              placeholder="Sem vínculo"
              options={clients.map((c) => ({ value: c.id, label: c.client_name }))}
            />
            <Input label="Empresa" value={form.company_name ?? ''} onChange={(e) => set('company_name', e.target.value)} />
            <Input label="Início" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            <Input label="Término" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        </div>

        <div className="card-base space-y-3 p-4">
          <span className="text-sm font-bold text-title">Financeiro</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Valor negociado (R$)" type="number" value={form.negotiated_value ?? ''} onChange={(e) => set('negotiated_value', e.target.value)} />
            <Input label="Forma de pagamento" value={form.payment_method ?? ''} onChange={(e) => set('payment_method', e.target.value)} />
            <Select
              label="Status do pagamento"
              value={form.payment_status ?? 'pendente'}
              onChange={(e) => set('payment_status', e.target.value as ContractInput['payment_status'])}
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'parcial', label: 'Parcial' },
                { value: 'pago', label: 'Pago' },
                { value: 'atrasado', label: 'Atrasado' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
          </div>
          <Textarea label="Observações do pagamento" rows={2} value={form.payment_notes ?? ''} onChange={(e) => set('payment_notes', e.target.value)} />
          <Textarea label="Observações internas" rows={2} value={form.internal_notes ?? ''} onChange={(e) => set('internal_notes', e.target.value)} />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card-base space-y-3 p-4 lg:sticky lg:top-20">
          <span className="text-sm font-bold text-title">Publicação</span>
          <Select
            label="Status do contrato"
            value={form.status ?? 'rascunho'}
            onChange={(e) => set('status', e.target.value as ContractInput['status'])}
            options={[
              { value: 'rascunho', label: 'Rascunho' },
              { value: 'agendado', label: 'Agendado' },
              { value: 'ativo', label: 'Ativo' },
              { value: 'pausado', label: 'Pausado' },
              { value: 'cancelado', label: 'Cancelado' },
            ]}
          />
          <Input label="Prioridade" type="number" value={form.priority ?? '0'} onChange={(e) => set('priority', e.target.value)} />
          <Checkbox label="Renovação automática" checked={Boolean(form.renewal_enabled)} onChange={(e) => set('renewal_enabled', e.target.checked)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={submit} className="w-full">{pending ? 'Salvando...' : 'Salvar contrato'}</Button>
          <p className="text-xs text-muted">
            Só aparece no site quando <strong>Ativo</strong>, dentro do período e com banner.
          </p>
        </div>
      </aside>
    </div>
  );
}
