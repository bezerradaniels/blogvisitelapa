'use client';

import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { centsFromCurrencyDigits, formatBrlInput } from '@/features/commercial';
import { saveCommercialProduct } from '@/features/commercial/actions';
import type { Tables } from '@/types/database';
import { formatCurrency } from '@/lib/utils/format';

type Product = Tables<'commercial_products'>;
type Placement = Tables<'advertising_placements'>;

interface ProductForm {
  id?: string;
  name: string;
  productType: string;
  description: string;
  defaultPriceCents: number;
  billingModel: string;
  defaultDurationDays: string;
  placementId: string;
  requiresMediaUpload: boolean;
  requiresDestinationUrl: boolean;
  requiresContentCreation: boolean;
  isRecurring: boolean;
  isActive: boolean;
}

const empty: ProductForm = {
  name: '', productType: 'banner', description: '', defaultPriceCents: 0,
  billingModel: 'valor_fixo', defaultDurationDays: '', placementId: '',
  requiresMediaUpload: true, requiresDestinationUrl: false, requiresContentCreation: false,
  isRecurring: false, isActive: true,
};

export default function ProductCatalogManager({ products, placements }: { products: Product[]; placements: Placement[] }) {
  const [form, setForm] = useState<ProductForm>(empty);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(next: Partial<ProductForm>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function edit(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      productType: product.product_type,
      description: product.description ?? '',
      defaultPriceCents: Math.round(product.default_price * 100),
      billingModel: product.billing_model,
      defaultDurationDays: product.default_duration_days ? String(product.default_duration_days) : '',
      placementId: product.placement_id ?? '',
      requiresMediaUpload: product.requires_media_upload,
      requiresDestinationUrl: product.requires_destination_url,
      requiresContentCreation: product.requires_content_creation,
      isRecurring: product.is_recurring,
      isActive: product.is_active,
    });
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await saveCommercialProduct({
        ...form,
        defaultDurationDays: form.defaultDurationDays ? Number(form.defaultDurationDays) : undefined,
      });
      if (!response.ok) return setError(response.error);
      setMessage(form.id ? 'Produto atualizado.' : 'Produto adicionado ao catálogo.');
      setForm(empty);
    });
  }

  return (
    <div className="space-y-6">
      <section className="card-base p-4 sm:p-5" aria-labelledby="catalog-form-heading">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="catalog-form-heading" className="text-lg font-extrabold text-title">{form.id ? 'Editar produto' : 'Novo produto ou serviço'}</h2><p className="mt-1 text-sm text-muted">Produtos do catálogo são reutilizados nos itens de contrato; não representam vendas avulsas.</p></div>{form.id && <Button type="button" size="sm" variant="ghost" onClick={() => setForm(empty)}>Cancelar edição</Button>}</div>
        {error && <p role="alert" className="mt-3 rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        {message && <p role="status" className="mt-3 rounded-[10px] bg-brand-soft px-3 py-2 text-sm text-brand-dark">{message}</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Input id="catalog-product-name" label="Nome" value={form.name} onChange={(event) => set({ name: event.target.value })} />
          <Select id="catalog-product-type" label="Tipo" value={form.productType} onChange={(event) => set({ productType: event.target.value })} options={[
            { value: 'banner', label: 'Banner' }, { value: 'conteudo_patrocinado', label: 'Conteúdo patrocinado' }, { value: 'evento_patrocinado', label: 'Evento patrocinado' }, { value: 'social', label: 'Redes sociais' }, { value: 'newsletter', label: 'Newsletter' }, { value: 'guia', label: 'Guia local' }, { value: 'servico', label: 'Serviço' }, { value: 'pacote', label: 'Pacote' }, { value: 'customizado', label: 'Customizado' },
          ]} />
          <Select id="catalog-placement" label="Posição de publicidade" value={form.placementId} onChange={(event) => set({ placementId: event.target.value })} placeholder="Sem posição" options={placements.map((placement) => ({ value: placement.id, label: placement.name }))} />
          <Input id="catalog-price" label="Preço de referência (R$)" inputMode="numeric" value={formatBrlInput(form.defaultPriceCents)} onChange={(event) => set({ defaultPriceCents: centsFromCurrencyDigits(event.target.value) })} />
          <Select id="catalog-billing" label="Modelo de cobrança" value={form.billingModel} onChange={(event) => set({ billingModel: event.target.value })} options={[
            { value: 'valor_fixo', label: 'Valor fixo' }, { value: 'diario', label: 'Diário' }, { value: 'semanal', label: 'Semanal' }, { value: 'mensal', label: 'Mensal' }, { value: 'publicacao', label: 'Por publicação' }, { value: 'impressao', label: 'Por impressão' }, { value: 'clique', label: 'Por clique' }, { value: 'negociado', label: 'Valor negociado' },
          ]} />
          <Input id="catalog-duration" label="Duração padrão (dias)" type="number" min="1" value={form.defaultDurationDays} onChange={(event) => set({ defaultDurationDays: event.target.value })} />
        </div>
        <Textarea id="catalog-description" label="Descrição" rows={2} className="mt-3" value={form.description} onChange={(event) => set({ description: event.target.value })} />
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 rounded-[12px] bg-surface p-3">
          <Checkbox id="catalog-media" label="Exige mídia" checked={form.requiresMediaUpload} onChange={(event) => set({ requiresMediaUpload: event.target.checked })} />
          <Checkbox id="catalog-link" label="Exige link de destino" checked={form.requiresDestinationUrl} onChange={(event) => set({ requiresDestinationUrl: event.target.checked })} />
          <Checkbox id="catalog-content" label="Exige conteúdo patrocinado" checked={form.requiresContentCreation} onChange={(event) => set({ requiresContentCreation: event.target.checked })} />
          <Checkbox id="catalog-recurring" label="Recorrente" checked={form.isRecurring} onChange={(event) => set({ isRecurring: event.target.checked })} />
          <Checkbox id="catalog-active" label="Disponível para venda" checked={form.isActive} onChange={(event) => set({ isActive: event.target.checked })} />
        </div>
        <Button type="button" className="mt-4" onClick={submit} disabled={pending}>{pending ? 'Salvando...' : form.id ? 'Salvar produto' : 'Adicionar ao catálogo'}</Button>
      </section>

      <section aria-labelledby="catalog-heading" className="space-y-3">
        <div><h2 id="catalog-heading" className="text-lg font-extrabold text-title">Catálogo atual</h2><p className="text-sm text-muted">Desative um item para preservar seu histórico sem oferecê-lo em novos contratos.</p></div>
        {products.length === 0 ? <div className="rounded-[14px] border border-dashed border-line p-5 text-sm text-muted">Nenhum produto cadastrado.</div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => { const placement = placements.find((item) => item.id === product.placement_id); return <article key={product.id} className="card-base p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-title">{product.name}</h3><p className="mt-0.5 text-xs text-muted">{product.product_type} · {product.billing_model}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${product.is_active ? 'bg-brand-soft text-brand-dark' : 'bg-surface text-muted'}`}>{product.is_active ? 'Ativo' : 'Inativo'}</span></div>{product.description && <p className="mt-3 text-sm text-body">{product.description}</p>}<dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted">Referência</dt><dd className="mt-0.5 font-bold text-title">{formatCurrency(product.default_price)}</dd></div><div><dt className="text-muted">Inventário</dt><dd className="mt-0.5 font-bold text-title">{placement?.name ?? '—'}</dd></div></dl><Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => edit(product)}>Editar</Button></article>; })}</div>}
      </section>

      <section aria-labelledby="inventory-heading" className="space-y-3 border-t border-line pt-6">
        <div><h2 id="inventory-heading" className="text-lg font-extrabold text-title">Inventário de posições</h2><p className="text-sm text-muted">Capacidade e formatos aceitos são protegidos no banco ao agendar ou ativar campanhas.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{placements.map((placement) => <article key={placement.id} className="card-base p-4"><div className="flex justify-between gap-3"><h3 className="font-bold text-title">{placement.name}</h3><span className={placement.is_active ? 'text-xs font-bold text-brand-dark' : 'text-xs font-bold text-muted'}>{placement.is_active ? 'Disponível' : 'Indisponível'}</span></div><dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted">Desktop</dt><dd className="mt-0.5 font-semibold text-title">{placement.desktop_dimensions ?? '—'}</dd></div><div><dt className="text-muted">Mobile</dt><dd className="mt-0.5 font-semibold text-title">{placement.mobile_dimensions ?? '—'}</dd></div><div><dt className="text-muted">Capacidade</dt><dd className="mt-0.5 font-semibold text-title">{placement.maximum_active_items} ativo(s)</dd></div><div><dt className="text-muted">Rotação</dt><dd className="mt-0.5 font-semibold text-title">{placement.rotation_enabled ? 'Sim' : 'Não'}</dd></div></dl></article>)}</div>
      </section>
    </div>
  );
}
