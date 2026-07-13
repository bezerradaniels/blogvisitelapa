'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { saveContract } from '@/features/admin/adActions';
import type { AdPlacement } from '@/types/database';

const PLACEMENTS: { value: AdPlacement; label: string }[] = [
  { value: 'home_top', label: 'Home — topo' },
  { value: 'home_middle', label: 'Home — meio' },
  { value: 'post_sidebar', label: 'Post — sidebar' },
  { value: 'post_inline_mobile', label: 'Post — mobile' },
  { value: 'category_top', label: 'Notícias — topo' },
  { value: 'event_sidebar', label: 'Eventos — sidebar' },
];

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
];

interface ClientOption {
  id: string;
  client_name: string;
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(cents: string) {
  if (!cents) return '';
  return (Number(cents) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Cadastro direto para a tela de Publicidade. Os campos financeiros continuam
// disponíveis em Contratos, mas não são necessários para colocar um banner no ar.
export default function QuickAdForm({ clients = [] }: { clients?: ClientOption[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<AdPlacement>('home_top');
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [contractValueCents, setContractValueCents] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!bannerUrl) {
      setError('Envie a imagem do anúncio.');
      return;
    }
    const client = clients.find((item) => item.id === clientId);
    if (!client) {
      setError('Selecione uma empresa cadastrada como cliente.');
      return;
    }

    start(async () => {
      const res = await saveContract({
        title: client.client_name,
        company_name: client.client_name,
        client_id: client.id,
        banner_url: bannerUrl,
        placement,
        start_date: startDate,
        end_date: endDate,
        link_url: linkUrl,
        negotiated_value: (Number(contractValueCents) / 100).toFixed(2),
        payment_method: paymentMethod,
        contract_type: 'publicidade',
        ad_type: 'banner',
        priority: '0',
        status: 'ativo',
      });
      if (!res.ok) {
        setError(res.error ?? 'Não foi possível publicar o anúncio.');
        return;
      }
      setSaved(true);
      setClientId('');
      setBannerUrl(null);
      setEndDate('');
      setLinkUrl('');
      setContractValueCents('');
      setPaymentMethod('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="card-base space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-extrabold text-title">Adicionar anúncio</h2>
        <p className="mt-0.5 text-sm text-muted">O anúncio ficará online automaticamente durante o período informado.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Select
            label="Empresa contratante"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clients.map((client) => ({ value: client.id, label: client.client_name }))}
            placeholder={clients.length ? 'Selecione um cliente' : 'Nenhum cliente cadastrado'}
            disabled={clients.length === 0}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Onde exibir"
              value={placement}
              onChange={(e) => setPlacement(e.target.value as AdPlacement)}
              options={PLACEMENTS}
            />
            <Input label="Link de destino (opcional)" type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Início" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label="Fim da exibição" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Valor do contrato (R$)"
              inputMode="numeric"
              value={formatCurrency(contractValueCents)}
              onChange={(e) => setContractValueCents(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))}
              placeholder="0,00"
              required
            />
            <Select
              label="Forma de pagamento"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={PAYMENT_METHODS}
              placeholder="Selecione a forma"
              required
            />
          </div>
        </div>
        <ImageUploader
          bucket="ad-banners"
          value={bannerUrl}
          onChange={setBannerUrl}
          label="Imagem do anúncio"
          ratio={placement === 'post_sidebar' ? 'aspect-square' : 'aspect-[16/5]'}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Anúncio publicado.</p>}
      <Button disabled={pending}>{pending ? 'Publicando…' : 'Publicar anúncio'}</Button>
    </form>
  );
}
