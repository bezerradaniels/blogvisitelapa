'use client';

import { useActionState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { submitAdvertiserContact, type ActionResult } from '@/features/contacts/actions';

const initial: ActionResult = { ok: false };

const adTypes = [
  { value: 'banner', label: 'Banner' },
  { value: 'post_patrocinado', label: 'Post patrocinado' },
  { value: 'evento_patrocinado', label: 'Evento patrocinado' },
  { value: 'guia_local', label: 'Guia local' },
  { value: 'pacote', label: 'Pacote personalizado' },
];

const budgets = [
  { value: 'ate_500', label: 'Até R$ 500' },
  { value: '500_1500', label: 'R$ 500 a R$ 1.500' },
  { value: '1500_5000', label: 'R$ 1.500 a R$ 5.000' },
  { value: 'acima_5000', label: 'Acima de R$ 5.000' },
];

export default function AdvertiserForm() {
  const [state, action, pending] = useActionState(submitAdvertiserContact, initial);

  if (state.ok) {
    return (
      <p className="card-base bg-brand-soft p-4 text-sm text-brand-dark">
        Recebemos seu interesse! Nossa equipe comercial entrará em contato.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <Input name="name" label="Nome" required />
      <Input name="company_name" label="Empresa" />
      <Input name="segment" label="Segmento" placeholder="Ex.: restaurante, hotel, comércio..." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="email" type="email" label="E-mail" required />
        <Input name="whatsapp" label="WhatsApp" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select name="ad_type" label="Tipo de anúncio" options={adTypes} placeholder="Selecione..." />
        <Select name="budget_range" label="Faixa de orçamento" options={budgets} placeholder="Selecione..." />
      </div>
      <Textarea name="message" label="Mensagem" rows={4} />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button variant="primary">{pending ? 'Enviando...' : 'Quero anunciar'}</Button>
    </form>
  );
}
