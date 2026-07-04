'use client';

import { useActionState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { submitContact, type ActionResult } from '@/features/contacts/actions';

const initial: ActionResult = { ok: false };

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  if (state.ok) {
    return (
      <p className="card-base bg-brand-soft p-4 text-sm text-brand-dark">
        Mensagem enviada com sucesso! Retornaremos em breve.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <Input name="name" label="Nome" required />
      <Input name="email" type="email" label="E-mail" required />
      <Input name="whatsapp" label="WhatsApp (opcional)" />
      <Input name="subject" label="Assunto" placeholder="Sugestão, correção, pauta, dúvida..." />
      <Textarea name="message" label="Mensagem" rows={5} required />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button variant="primary">{pending ? 'Enviando...' : 'Enviar mensagem'}</Button>
    </form>
  );
}
