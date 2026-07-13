'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import {
  calculateContractTotals,
  centsFromCurrencyDigits,
  createInstallmentSchedule,
  formatBrlCents,
  formatBrlInput,
} from '@/features/commercial';
import {
  createCommercialBrand,
  createCommercialContract,
  createQuickCommercialClient,
  type ClientDuplicate,
} from '@/features/commercial/actions';
import type {
  CampaignDraft,
  CommercialBrandOption,
  CommercialClientOption,
  CommercialPlacementOption,
  CommercialProductOption,
  CommercialContractDraft,
  ContractItemDraft,
} from '@/features/commercial/types';

const STEPS = ['Cliente', 'Contrato', 'Itens', 'Publicidade', 'Pagamento', 'Revisão'];

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function emptyItem(startDate: string, endDate = ''): ContractItemDraft {
  return {
    customName: '',
    description: '',
    quantity: 1,
    unitPriceCents: 0,
    discountCents: 0,
    startDate,
    endDate,
    placement: '',
    placementId: null,
    requiresMediaUpload: false,
    requiresContentCreation: false,
    notes: '',
  };
}

function newCampaign(itemIndex: number, item: ContractItemDraft, startDate: string, endDate: string): CampaignDraft {
  return {
    itemIndex,
    campaignName: item.customName || 'Nova campanha',
    placement: item.placement || 'home_top',
    placementId: item.placementId ?? null,
    desktopMediaUrl: '',
    mobileMediaUrl: '',
    alternativeText: '',
    destinationUrl: '',
    startAt: startDate ? `${startDate}T00:00` : '',
    endAt: endDate ? `${endDate}T23:59` : '',
    priority: 0,
    rotationWeight: 1,
    isVisible: true,
    clickTrackingEnabled: false,
    impressionTrackingEnabled: false,
    status: 'rascunho',
  };
}

interface Props {
  clients: CommercialClientOption[];
  brands: CommercialBrandOption[];
  products: CommercialProductOption[];
  placements: CommercialPlacementOption[];
}

export default function ContractWizard({ clients: initialClients, brands: initialBrands, products, placements }: Props) {
  const router = useRouter();
  const today = todayKey();
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState(initialClients);
  const [brands, setBrands] = useState(initialBrands);
  const [form, setForm] = useState<CommercialContractDraft>({
    clientId: '',
    advertiserId: '',
    title: '',
    description: '',
    startDate: today,
    endDate: '',
    internalNotes: '',
    clientNotes: '',
    renewalEnabled: false,
    renewalPeriodDays: 30,
    renewalNoticeDays: 30,
    contractDiscountType: '',
    contractDiscountValue: 0,
    additionalCostsCents: 0,
    paymentMethod: '',
    paymentTerms: '',
    installmentCount: 1,
    billingDueDate: today,
    items: [emptyItem(today)],
    campaigns: [],
    payments: [],
    status: 'rascunho',
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [quickBrandOpen, setQuickBrandOpen] = useState(false);
  const [quickClient, setQuickClient] = useState({ clientName: '', email: '', phone: '', document: '' });
  const [quickBrand, setQuickBrand] = useState({ name: '', website: '' });
  const [duplicates, setDuplicates] = useState<ClientDuplicate[]>([]);

  const availableBrands = useMemo(
    () => brands.filter((brand) => brand.client_id === form.clientId && brand.is_active),
    [brands, form.clientId],
  );
  const totals = useMemo(() => {
    try {
      return calculateContractTotals({
        items: form.items.map((item) => ({
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discount: { type: 'fixed' as const, amountCents: item.discountCents },
        })),
        contractDiscount: form.contractDiscountType === 'percentual'
          ? { type: 'percentage' as const, percentage: form.contractDiscountValue }
          : form.contractDiscountType === 'valor'
            ? { type: 'fixed' as const, amountCents: form.contractDiscountValue }
            : undefined,
        additionalCostsCents: form.additionalCostsCents,
      });
    } catch {
      return null;
    }
  }, [form.additionalCostsCents, form.contractDiscountType, form.contractDiscountValue, form.items]);
  const schedule = useMemo(() => {
    if (!totals || !form.billingDueDate || form.installmentCount < 1) return [];
    try {
      return createInstallmentSchedule({
        totalCents: totals.totalCents,
        installmentCount: form.installmentCount,
        firstDueDate: form.billingDueDate,
      });
    } catch {
      return [];
    }
  }, [form.billingDueDate, form.installmentCount, totals]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || pending) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, pending]);

  function update(next: Partial<CommercialContractDraft>) {
    setDirty(true);
    setForm((current) => ({ ...current, ...next }));
  }

  function updateItem(index: number, next: Partial<ContractItemDraft>) {
    setDirty(true);
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item),
    }));
  }

  function updateCampaign(index: number, next: Partial<CampaignDraft>) {
    setDirty(true);
    setForm((current) => ({
      ...current,
      campaigns: current.campaigns.map((campaign, campaignIndex) => campaignIndex === index ? { ...campaign, ...next } : campaign),
    }));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    if (!product) return updateItem(index, { productId: null });
    const placement = product.placement_code ?? '';
    updateItem(index, {
      productId: product.id,
      customName: product.name,
      unitPriceCents: Math.round(product.default_price * 100),
      placement,
      placementId: product.placement_id,
      requiresMediaUpload: product.requires_media_upload,
      requiresContentCreation: product.requires_content_creation,
    });
  }

  function addItem() {
    update({ items: [...form.items, emptyItem(form.startDate, form.endDate)] });
  }

  function removeItem(index: number) {
    if (form.items.length === 1) return;
    const items = form.items.filter((_, itemIndex) => itemIndex !== index);
    const campaigns = form.campaigns
      .filter((campaign) => campaign.itemIndex !== index)
      .map((campaign) => campaign.itemIndex > index ? { ...campaign, itemIndex: campaign.itemIndex - 1 } : campaign);
    update({ items, campaigns });
  }

  function addCampaign() {
    const index = form.items.findIndex((item) => Boolean(item.placement));
    if (index < 0) {
      setError('Adicione uma posição de publicidade a pelo menos um item antes de configurar uma campanha.');
      return;
    }
    update({ campaigns: [...form.campaigns, newCampaign(index, form.items[index]!, form.startDate, form.endDate)] });
  }

  function createClient(confirmSimilar = false) {
    setError(null);
    startTransition(async () => {
      const result = await createQuickCommercialClient({ ...quickClient, confirmSimilar });
      if (!result.ok) {
        setError(result.error);
        setDuplicates(result.duplicates ?? []);
        return;
      }
      const client: CommercialClientOption = {
        id: result.id!,
        client_name: quickClient.clientName.trim(),
        trade_name: quickClient.clientName.trim(),
        company_name: quickClient.clientName.trim(),
        email: quickClient.email || null,
        whatsapp: quickClient.phone || null,
        document: quickClient.document || null,
        is_active: true,
      };
      setClients((current) => [...current, client].sort((a, b) => a.client_name.localeCompare(b.client_name)));
      update({ clientId: client.id, advertiserId: '' });
      setQuickClient({ clientName: '', email: '', phone: '', document: '' });
      setDuplicates([]);
      setQuickClientOpen(false);
      setNotice('Cliente criado e selecionado para este contrato.');
    });
  }

  function createBrand() {
    if (!form.clientId) {
      setError('Selecione um cliente antes de criar uma marca.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createCommercialBrand({ clientId: form.clientId, ...quickBrand });
      if (!result.ok) return setError(result.error);
      const brand: CommercialBrandOption = { id: result.id!, client_id: form.clientId, name: quickBrand.name.trim(), is_active: true };
      setBrands((current) => [...current, brand]);
      update({ advertiserId: brand.id });
      setQuickBrand({ name: '', website: '' });
      setQuickBrandOpen(false);
      setNotice('Marca criada e associada ao contrato.');
    });
  }

  function goNext() {
    setError(null);
    if (step === 0 && !form.clientId) return setError('Selecione ou crie o cliente responsável pelo contrato.');
    if (step === 1 && (!form.title.trim() || !form.startDate || !form.endDate)) return setError('Informe título, início e término do contrato.');
    if (step === 2 && (!totals || form.items.some((item) => !item.customName.trim()))) return setError('Revise os itens e os descontos antes de continuar.');
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

  function save(status: 'rascunho' | 'pendente_aprovacao') {
    if (!totals) return setError('Revise os valores e descontos do contrato.');
    setError(null);
    startTransition(async () => {
      const result = await createCommercialContract({
        ...form,
        status,
        payments: schedule.map((payment) => ({
          installmentNumber: payment.number,
          amountCents: payment.amountCents,
          paidAmountCents: 0,
          dueDate: payment.dueDate,
          paymentMethod: form.paymentMethod,
          status: 'pendente',
        })),
      });
      if (!result.ok) return setError(result.error);
      setDirty(false);
      router.push(`/admin/comercial/contratos/${result.id}`);
      router.refresh();
    });
  }

  const selectedClient = clients.find((client) => client.id === form.clientId);
  const clientLabel = selectedClient?.trade_name ?? selectedClient?.company_name ?? selectedClient?.client_name ?? 'Não selecionado';

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Novo acordo comercial</p>
          <h1 className="mt-1 font-headline text-2xl font-extrabold text-title">Criar contrato</h1>
          <p className="mt-1 text-sm text-muted">O contrato reúne itens, entregáveis e financeiro em um único fluxo.</p>
        </div>
        <Button href="/admin/comercial/contratos" variant="outline" size="sm">Voltar para contratos</Button>
      </header>

      <ol aria-label="Etapas do contrato" className="grid grid-cols-3 gap-2 rounded-[16px] border border-line bg-card p-2 sm:grid-cols-6">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => index <= step && setStep(index)}
              aria-current={index === step ? 'step' : undefined}
              className={`w-full rounded-[10px] px-2 py-2 text-left text-xs font-bold ${index === step ? 'bg-brand text-white' : index < step ? 'bg-brand-soft text-brand-dark' : 'text-muted'}`}
            >
              <span className="mr-1 opacity-80">{index + 1}.</span>{label}
            </button>
          </li>
        ))}
      </ol>

      {notice && <p role="status" className="rounded-[12px] bg-brand-soft px-3 py-2 text-sm text-brand-dark">{notice}</p>}
      {error && <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="card-base p-4 sm:p-5">
        {step === 0 && (
          <section aria-labelledby="client-step-heading" className="space-y-4">
            <div>
              <h2 id="client-step-heading" className="text-lg font-extrabold text-title">Cliente e anunciante</h2>
              <p className="mt-1 text-sm text-muted">O cliente é responsável pelo vínculo e pagamento. A marca é opcional e aparece publicamente.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="contract-client"
                label="Cliente responsável"
                value={form.clientId}
                onChange={(event) => update({ clientId: event.target.value, advertiserId: '' })}
                placeholder="Selecione um cliente cadastrado"
                options={clients.map((client) => ({ value: client.id, label: client.trade_name ?? client.company_name ?? client.client_name }))}
                required
              />
              <Select
                id="contract-brand"
                label="Marca / anunciante (opcional)"
                value={form.advertiserId ?? ''}
                onChange={(event) => update({ advertiserId: event.target.value })}
                placeholder={form.clientId ? 'Usar o próprio cliente' : 'Selecione um cliente primeiro'}
                disabled={!form.clientId}
                options={availableBrands.map((brand) => ({ value: brand.id, label: brand.name }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setQuickClientOpen((value) => !value)}>
                {quickClientOpen ? 'Fechar cadastro rápido' : '+ Criar cliente sem sair'}
              </Button>
              {form.clientId && (
                <Button type="button" size="sm" variant="outline" onClick={() => setQuickBrandOpen((value) => !value)}>
                  {quickBrandOpen ? 'Fechar marca' : '+ Criar marca'}
                </Button>
              )}
            </div>
            {quickClientOpen && (
              <div className="rounded-[14px] border border-brand/30 bg-brand-soft/40 p-4">
                <h3 className="font-bold text-title">Novo cliente</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input id="quick-client-name" label="Nome ou empresa" value={quickClient.clientName} onChange={(event) => setQuickClient({ ...quickClient, clientName: event.target.value })} />
                  <Input id="quick-client-email" label="E-mail" type="email" value={quickClient.email} onChange={(event) => setQuickClient({ ...quickClient, email: event.target.value })} />
                  <Input id="quick-client-phone" label="WhatsApp" inputMode="tel" value={quickClient.phone} onChange={(event) => setQuickClient({ ...quickClient, phone: event.target.value })} />
                  <Input id="quick-client-document" label="CPF/CNPJ" inputMode="numeric" value={quickClient.document} onChange={(event) => setQuickClient({ ...quickClient, document: event.target.value })} />
                </div>
                {duplicates.length > 0 && (
                  <div className="mt-3 rounded-[10px] bg-warning/10 p-3 text-sm text-body">
                    <p className="font-bold">Possível duplicidade encontrada</p>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {duplicates.map((duplicate) => <li key={duplicate.id}>{duplicate.clientName} — mesmo {duplicate.reason}</li>)}
                    </ul>
                    <Button type="button" size="sm" className="mt-2" onClick={() => createClient(true)} disabled={pending}>Criar mesmo assim</Button>
                  </div>
                )}
                <Button type="button" size="sm" className="mt-3" onClick={() => createClient(false)} disabled={pending}>Salvar e selecionar cliente</Button>
              </div>
            )}
            {quickBrandOpen && (
              <div className="rounded-[14px] border border-brand/30 bg-brand-soft/40 p-4">
                <h3 className="font-bold text-title">Nova marca para {clientLabel}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input id="quick-brand-name" label="Nome da marca" value={quickBrand.name} onChange={(event) => setQuickBrand({ ...quickBrand, name: event.target.value })} />
                  <Input id="quick-brand-website" label="Site (opcional)" type="url" placeholder="https://" value={quickBrand.website} onChange={(event) => setQuickBrand({ ...quickBrand, website: event.target.value })} />
                </div>
                <Button type="button" size="sm" className="mt-3" onClick={createBrand} disabled={pending}>Salvar marca</Button>
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="contract-step-heading" className="space-y-4">
            <div>
              <h2 id="contract-step-heading" className="text-lg font-extrabold text-title">Dados do contrato</h2>
              <p className="mt-1 text-sm text-muted">As datas definem a vigência comercial; cada item pode ter período próprio.</p>
            </div>
            <Input id="contract-title" label="Título do contrato" value={form.title} onChange={(event) => update({ title: event.target.value })} required />
            <Textarea id="contract-description" label="Descrição (opcional)" rows={3} value={form.description} onChange={(event) => update({ description: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input id="contract-start" label="Início da vigência" type="date" value={form.startDate} onChange={(event) => update({ startDate: event.target.value })} required />
              <Input id="contract-end" label="Fim da vigência" type="date" value={form.endDate} onChange={(event) => update({ endDate: event.target.value })} required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Textarea id="contract-internal-note" label="Observações internas" rows={3} value={form.internalNotes} onChange={(event) => update({ internalNotes: event.target.value })} />
              <Textarea id="contract-client-note" label="Observações para o cliente" rows={3} value={form.clientNotes} onChange={(event) => update({ clientNotes: event.target.value })} />
            </div>
            <div className="rounded-[14px] bg-surface p-4">
              <Checkbox id="contract-renewal" label="Sugerir renovação automática" checked={form.renewalEnabled} onChange={(event) => update({ renewalEnabled: event.target.checked })} />
              {form.renewalEnabled && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input id="renewal-period" label="Novo período (dias)" type="number" min="1" value={form.renewalPeriodDays ?? ''} onChange={(event) => update({ renewalPeriodDays: Number(event.target.value) || undefined })} />
                  <Input id="renewal-notice" label="Avisar com antecedência (dias)" type="number" min="0" value={form.renewalNoticeDays} onChange={(event) => update({ renewalNoticeDays: Number(event.target.value) || 0 })} />
                </div>
              )}
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="items-step-heading" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="items-step-heading" className="text-lg font-extrabold text-title">Produtos e serviços</h2>
                <p className="mt-1 text-sm text-muted">Adicione quantos entregáveis forem necessários. O valor final é calculado automaticamente.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>+ Adicionar item</Button>
            </div>
            <div className="space-y-4">
              {form.items.map((item, index) => (
                <fieldset key={`${item.productId ?? 'custom'}-${index}`} className="rounded-[16px] border border-line p-4">
                  <legend className="px-1 text-sm font-bold text-title">Item {index + 1}</legend>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <Select id={`item-product-${index}`} label="Produto do catálogo" value={item.productId ?? ''} onChange={(event) => selectProduct(index, event.target.value)} placeholder="Item personalizado" options={products.map((product) => ({ value: product.id, label: product.name }))} />
                    <Input id={`item-name-${index}`} label="Nome do item" value={item.customName} onChange={(event) => updateItem(index, { customName: event.target.value })} required />
                    <Input id={`item-quantity-${index}`} label="Quantidade" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 0 })} />
                    <Input id={`item-unit-price-${index}`} label="Valor unitário (R$)" inputMode="numeric" value={formatBrlInput(item.unitPriceCents)} onChange={(event) => updateItem(index, { unitPriceCents: centsFromCurrencyDigits(event.target.value) })} />
                    <Input id={`item-discount-${index}`} label="Desconto do item (R$)" inputMode="numeric" value={formatBrlInput(item.discountCents)} onChange={(event) => updateItem(index, { discountCents: centsFromCurrencyDigits(event.target.value) })} />
                    <Select id={`item-placement-${index}`} label="Posição (se aplicável)" value={item.placement ?? ''} onChange={(event) => {
                      const placement = placements.find((value) => value.code === event.target.value);
                      updateItem(index, { placement: event.target.value as ContractItemDraft['placement'], placementId: placement?.id ?? null });
                    }} placeholder="Não é publicidade" options={placements.map((placement) => ({ value: placement.code, label: `${placement.name}${placement.desktop_dimensions ? ` (${placement.desktop_dimensions})` : ''}` }))} />
                    <Input id={`item-start-${index}`} label="Início do item" type="date" value={item.startDate ?? ''} onChange={(event) => updateItem(index, { startDate: event.target.value })} />
                    <Input id={`item-end-${index}`} label="Fim do item" type="date" value={item.endDate ?? ''} onChange={(event) => updateItem(index, { endDate: event.target.value })} />
                  </div>
                  <Textarea id={`item-note-${index}`} label="Observações do item" rows={2} className="mt-3" value={item.notes ?? ''} onChange={(event) => updateItem(index, { notes: event.target.value })} />
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <Checkbox id={`item-media-${index}`} label="Exige mídia de anúncio" checked={item.requiresMediaUpload} onChange={(event) => updateItem(index, { requiresMediaUpload: event.target.checked })} />
                    <Checkbox id={`item-content-${index}`} label="Exige conteúdo patrocinado" checked={item.requiresContentCreation} onChange={(event) => updateItem(index, { requiresContentCreation: event.target.checked })} />
                    <span className="ml-auto text-sm font-bold text-title">
                      Total: {totals?.items[index] ? formatBrlCents(totals.items[index].totalCents) : '—'}
                    </span>
                    {form.items.length > 1 && <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={() => removeItem(index)}>Remover</Button>}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="grid gap-3 rounded-[16px] bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
              <Select id="contract-discount-type" label="Desconto do contrato" value={form.contractDiscountType ?? ''} onChange={(event) => update({ contractDiscountType: event.target.value as CommercialContractDraft['contractDiscountType'], contractDiscountValue: 0 })} placeholder="Sem desconto" options={[{ value: 'valor', label: 'Valor em R$' }, { value: 'percentual', label: 'Percentual' }]} />
              {form.contractDiscountType === 'percentual' ? (
                <Input id="contract-discount-percent" label="Desconto (%)" type="number" min="0" max="100" step="0.01" value={form.contractDiscountValue} onChange={(event) => update({ contractDiscountValue: Number(event.target.value) || 0 })} />
              ) : (
                <Input id="contract-discount-value" label="Desconto (R$)" inputMode="numeric" value={formatBrlInput(form.contractDiscountValue)} onChange={(event) => update({ contractDiscountValue: centsFromCurrencyDigits(event.target.value) })} disabled={!form.contractDiscountType} />
              )}
              <Input id="contract-extra-costs" label="Custos adicionais (R$)" inputMode="numeric" value={formatBrlInput(form.additionalCostsCents)} onChange={(event) => update({ additionalCostsCents: centsFromCurrencyDigits(event.target.value) })} />
              <div className="rounded-[10px] bg-card px-3 py-2">
                <span className="block text-xs font-medium text-muted">Valor final</span>
                <strong className="text-lg text-title">{totals ? formatBrlCents(totals.totalCents) : 'Revise os valores'}</strong>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="campaign-step-heading" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="campaign-step-heading" className="text-lg font-extrabold text-title">Publicidade e entregáveis</h2>
                <p className="mt-1 text-sm text-muted">Configure apenas os itens que serão exibidos como publicidade. Conteúdos patrocinados podem ser vinculados no detalhe após salvar.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addCampaign}>+ Configurar campanha</Button>
            </div>
            {form.campaigns.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-line p-5 text-sm text-muted">Nenhuma campanha adicionada. Isso é normal para itens sem publicidade de banner.</div>
            ) : form.campaigns.map((campaign, index) => {
              const item = form.items[campaign.itemIndex];
              return (
                <fieldset key={`${campaign.campaignName}-${index}`} className="rounded-[16px] border border-line p-4">
                  <legend className="px-1 text-sm font-bold text-title">Campanha {index + 1}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select id={`campaign-item-${index}`} label="Item contratado" value={String(campaign.itemIndex)} onChange={(event) => {
                      const itemIndex = Number(event.target.value);
                      const target = form.items[itemIndex];
                      if (target) updateCampaign(index, { itemIndex, placement: target.placement || 'home_top', placementId: target.placementId ?? null });
                    }} options={form.items.map((value, itemIndex) => ({ value: String(itemIndex), label: value.customName || `Item ${itemIndex + 1}` }))} />
                    <Input id={`campaign-name-${index}`} label="Nome da campanha" value={campaign.campaignName} onChange={(event) => updateCampaign(index, { campaignName: event.target.value })} />
                    <Select id={`campaign-placement-${index}`} label="Onde exibir" value={campaign.placement} onChange={(event) => {
                      const placement = placements.find((value) => value.code === event.target.value);
                      updateCampaign(index, { placement: event.target.value as CampaignDraft['placement'], placementId: placement?.id ?? null });
                    }} options={placements.map((placement) => ({ value: placement.code, label: placement.name }))} />
                    <Input id={`campaign-link-${index}`} label="URL de destino (opcional)" type="url" placeholder="https://" value={campaign.destinationUrl ?? ''} onChange={(event) => updateCampaign(index, { destinationUrl: event.target.value })} />
                    <Input id={`campaign-start-${index}`} label="Início da exibição" type="datetime-local" value={campaign.startAt} onChange={(event) => updateCampaign(index, { startAt: event.target.value })} />
                    <Input id={`campaign-end-${index}`} label="Fim da exibição" type="datetime-local" value={campaign.endAt} onChange={(event) => updateCampaign(index, { endAt: event.target.value })} />
                    <Input id={`campaign-alt-${index}`} label="Texto alternativo" value={campaign.alternativeText ?? ''} onChange={(event) => updateCampaign(index, { alternativeText: event.target.value })} />
                    <Input id={`campaign-priority-${index}`} label="Prioridade" type="number" min="0" value={campaign.priority} onChange={(event) => updateCampaign(index, { priority: Number(event.target.value) || 0 })} />
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <ImageUploader bucket="ad-banners" prefix="commercial" value={campaign.desktopMediaUrl ?? null} onChange={(url) => updateCampaign(index, { desktopMediaUrl: url ?? '' })} label="Mídia desktop" ratio={campaign.placement === 'post_sidebar' ? 'aspect-square' : 'aspect-[16/5]'} />
                    <ImageUploader bucket="ad-banners" prefix="commercial" value={campaign.mobileMediaUrl ?? null} onChange={(url) => updateCampaign(index, { mobileMediaUrl: url ?? '' })} label="Mídia mobile (opcional)" ratio="aspect-[16/5]" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <Checkbox id={`campaign-visible-${index}`} label="Visível ao ser aprovada" checked={campaign.isVisible} onChange={(event) => updateCampaign(index, { isVisible: event.target.checked })} />
                    <Checkbox id={`campaign-click-track-${index}`} label="Registrar cliques" checked={campaign.clickTrackingEnabled} onChange={(event) => updateCampaign(index, { clickTrackingEnabled: event.target.checked })} />
                    <Checkbox id={`campaign-impression-track-${index}`} label="Registrar impressões" checked={campaign.impressionTrackingEnabled} onChange={(event) => updateCampaign(index, { impressionTrackingEnabled: event.target.checked })} />
                    <span className="text-xs text-muted">Item: {item?.customName || 'não encontrado'}</span>
                    <Button type="button" size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => update({ campaigns: form.campaigns.filter((_, campaignIndex) => campaignIndex !== index) })}>Remover campanha</Button>
                  </div>
                </fieldset>
              );
            })}
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby="payment-step-heading" className="space-y-4">
            <div>
              <h2 id="payment-step-heading" className="text-lg font-extrabold text-title">Pagamento e recebíveis</h2>
              <p className="mt-1 text-sm text-muted">As parcelas são distribuídas sem perder centavos e precisam somar o valor final.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Select id="payment-method" label="Forma de pagamento" value={form.paymentMethod ?? ''} onChange={(event) => update({ paymentMethod: event.target.value })} placeholder="Selecione" options={[
                { value: 'pix', label: 'PIX' }, { value: 'boleto', label: 'Boleto' }, { value: 'cartao', label: 'Cartão' }, { value: 'transferencia', label: 'Transferência bancária' }, { value: 'dinheiro', label: 'Dinheiro' }, { value: 'outro', label: 'Outro' },
              ]} />
              <Input id="payment-count" label="Quantidade de parcelas" type="number" min="1" max="120" value={form.installmentCount} onChange={(event) => update({ installmentCount: Math.max(1, Number(event.target.value) || 1) })} />
              <Input id="payment-first-due" label="Primeiro vencimento" type="date" value={form.billingDueDate ?? ''} onChange={(event) => update({ billingDueDate: event.target.value })} />
              <div className="rounded-[10px] bg-surface px-3 py-2">
                <span className="block text-xs font-medium text-muted">Total a receber</span>
                <strong className="text-lg text-title">{totals ? formatBrlCents(totals.totalCents) : '—'}</strong>
              </div>
            </div>
            <Textarea id="payment-terms" label="Condições de pagamento" rows={2} value={form.paymentTerms ?? ''} onChange={(event) => update({ paymentTerms: event.target.value })} placeholder="Ex.: 30 dias, mediante nota fiscal." />
            <div className="overflow-hidden rounded-[14px] border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs text-muted"><tr><th className="p-3">Parcela</th><th className="p-3">Vencimento</th><th className="p-3 text-right">Valor</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {schedule.map((payment) => <tr key={payment.number}><td className="p-3">{payment.number}ª</td><td className="p-3">{payment.dueDate.split('-').reverse().join('/')}</td><td className="p-3 text-right font-bold">{formatBrlCents(payment.amountCents)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {step === 5 && (
          <section aria-labelledby="review-step-heading" className="space-y-4">
            <div>
              <h2 id="review-step-heading" className="text-lg font-extrabold text-title">Revisar e salvar</h2>
              <p className="mt-1 text-sm text-muted">Revise os dados críticos. Campanhas só podem ser publicadas depois da aprovação e dentro da vigência.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[12px] bg-surface p-3"><span className="text-xs text-muted">Cliente</span><strong className="mt-1 block text-title">{clientLabel}</strong></div>
              <div className="rounded-[12px] bg-surface p-3"><span className="text-xs text-muted">Vigência</span><strong className="mt-1 block text-title">{form.startDate || '—'} → {form.endDate || '—'}</strong></div>
              <div className="rounded-[12px] bg-surface p-3"><span className="text-xs text-muted">Valor final</span><strong className="mt-1 block text-title">{totals ? formatBrlCents(totals.totalCents) : '—'}</strong></div>
              <div className="rounded-[12px] bg-surface p-3"><span className="text-xs text-muted">Itens</span><strong className="mt-1 block text-title">{form.items.length}</strong></div>
              <div className="rounded-[12px] bg-surface p-3"><span className="text-xs text-muted">Campanhas</span><strong className="mt-1 block text-title">{form.campaigns.length}</strong></div>
              <div className="rounded-[12px] bg-surface p-3"><span className="text-xs text-muted">Recebíveis</span><strong className="mt-1 block text-title">{schedule.length} parcela(s)</strong></div>
            </div>
            {form.items.some((item) => item.requiresContentCreation) && <p className="rounded-[12px] border border-warning bg-warning/5 p-3 text-sm text-body">Este contrato possui conteúdo patrocinado. Após salvar, vincule o artigo ou evento ao item na aba de entregáveis.</p>}
            {form.campaigns.some((campaign) => !campaign.desktopMediaUrl) && <p className="rounded-[12px] border border-warning bg-warning/5 p-3 text-sm text-body">Há campanha sem mídia desktop; ela será mantida como rascunho/aguardando mídia até ser configurada.</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => save('rascunho')} disabled={pending}>{pending ? 'Salvando...' : 'Salvar rascunho'}</Button>
              <Button type="button" onClick={() => save('pendente_aprovacao')} disabled={pending}>{pending ? 'Enviando...' : 'Enviar para aprovação'}</Button>
            </div>
          </section>
        )}
      </div>

      <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-[16px] border border-line bg-card p-3 shadow-lg">
        <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || pending}>Anterior</Button>
        <span className="hidden text-xs text-muted sm:block">Etapa {step + 1} de {STEPS.length}</span>
        {step < STEPS.length - 1 ? <Button type="button" onClick={goNext} disabled={pending}>Continuar</Button> : <Button type="button" onClick={() => save('rascunho')} disabled={pending}>Salvar rascunho</Button>}
      </div>
    </div>
  );
}
