'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import EventDateRangePicker from '@/features/events/EventDateRangePicker';
import { submitEvent } from '@/features/events/actions';

interface EventSubmissionModalProps {
  isAuthenticated: boolean;
}

type Step = 'account' | 'form' | 'success';

function dateTimeToIso(dateValue: string, timeValue = '', endOfDay = false) {
  if (!dateValue) return '';
  const date = new Date(`${dateValue}T${timeValue || (endOfDay ? '23:59:59' : '00:00:00')}`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function EventSubmissionModal({ isAuthenticated }: EventSubmissionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(isAuthenticated ? 'form' : 'account');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');

  function open() {
    setStep(isAuthenticated ? 'form' : 'account');
    setError(null);
    setWhatsapp('');
    setIsFree(false);
    setEventStartDate('');
    setEventEndDate('');
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitEvent({
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? ''),
        eventStartDate: dateTimeToIso(eventStartDate, String(formData.get('eventStartTime') ?? '')),
        eventEndDate: dateTimeToIso(eventEndDate, '', true),
        eventLocation: String(formData.get('eventLocation') ?? ''),
        eventAddress: String(formData.get('eventAddress') ?? ''),
        eventTicketPrice: String(formData.get('eventTicketPrice') ?? ''),
        eventOrganizer: String(formData.get('eventOrganizer') ?? ''),
        eventIsFree: formData.get('eventIsFree') === 'on',
        contactName: String(formData.get('contactName') ?? ''),
        contactEmail: String(formData.get('contactEmail') ?? ''),
        contactWhatsapp: whatsapp,
        acceptsPolicy: formData.get('acceptsPolicy') === 'on',
      });
      if (!result.ok) {
        setError(result.error ?? 'Não foi possível enviar o evento.');
        return;
      }
      setStep('success');
    });
  }

  return (
    <>
      <Button type="button" onClick={open}>Cadastrar evento</Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="event-submission-title"
        className="w-[calc(100%-2rem)] max-w-2xl rounded-[16px] border border-line bg-card p-0 text-body shadow-xl backdrop:bg-title/40"
      >
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="event-submission-title" className="text-xl font-extrabold text-title">Cadastrar evento</h2>
              {step !== 'success' && <p className="mt-1 text-sm text-muted">Todos os eventos passam pela aprovação da equipe do portal.</p>}
            </div>
            <button type="button" onClick={close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="Fechar">
              <Icon icon="Cancel01Icon" size={20} />
            </button>
          </div>

          {step === 'account' && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-body">Para enviar um evento, você pode entrar na sua conta, criar uma nova conta ou continuar como visitante.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Link href="/login?redirect=%2Feventos" className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">Fazer login</Link>
                <Link href="/cadastro?redirect=%2Feventos" className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-bold text-body hover:bg-surface">Criar conta</Link>
                <button type="button" onClick={() => setStep('form')} className="h-10 rounded-full border border-line bg-card px-4 text-sm font-bold text-body hover:bg-surface">Seguir como visitante</button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form action={handleSubmit} className="mt-6 space-y-4">
              {!isAuthenticated && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Seu nome" name="contactName" required />
                  <Field label="Nome do evento" name="title" required />
                </div>
              )}
              {isAuthenticated && <Field label="Nome do evento" name="title" required />}
              <div className={isAuthenticated ? undefined : 'grid gap-4 sm:grid-cols-2'}>
                {!isAuthenticated && <Field label="Seu e-mail" name="contactEmail" type="email" required />}
                <label className="grid gap-1 text-sm font-medium text-body">WhatsApp para contato<input name="contactWhatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" required value={whatsapp} onChange={(event) => setWhatsapp(formatWhatsapp(event.target.value))} placeholder="(77) 99999-9999" maxLength={15} className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm outline-none focus:border-brand" /></label>
              </div>
              <label className="grid gap-1 text-sm font-medium text-body">
                Descrição
                <textarea name="description" required minLength={10} maxLength={5000} rows={4} className="w-full rounded-[10px] border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand" />
              </label>
              <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <EventDateRangePicker startDate={eventStartDate} endDate={eventEndDate} onChange={(startDate, endDate) => { setEventStartDate(startDate); setEventEndDate(endDate); }} />
                <Field label="Horário de início" name="eventStartTime" type="time" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Local" name="eventLocation" required />
                <Field label="Responsável / organizador" name="eventOrganizer" required />
              </div>
              <Field label="Endereço" name="eventAddress" />
              <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Field label="Valor do ingresso" name="eventTicketPrice" disabled={isFree} placeholder={isFree ? 'Evento gratuito' : 'Ex.: R$ 20,00'} />
                <label className="flex h-10 items-center gap-2 whitespace-nowrap text-sm font-medium text-body"><input type="checkbox" name="eventIsFree" checked={isFree} onChange={(event) => setIsFree(event.target.checked)} className="flex h-5 w-5 appearance-none items-center justify-center rounded-full border border-line checked:border-brand checked:bg-brand checked:after:h-2 checked:after:w-2 checked:after:rounded-full checked:after:bg-white focus:outline-none focus:ring-2 focus:ring-brand/30" /> Evento gratuito</label>
              </div>
              <label className="flex items-start gap-2 text-xs text-muted"><input type="checkbox" name="acceptsPolicy" required className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand" /> Confirmo que as informações são verdadeiras e entendo que o evento será analisado antes de ser publicado.</label>
              {error && <p role="alert" className="rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
              <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={close} className="h-10 rounded-full border border-line px-4 text-sm font-bold text-body hover:bg-surface">Cancelar</button><button type="submit" disabled={pending} className="h-10 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">{pending ? 'Enviando...' : 'Enviar para aprovação'}</button></div>
            </form>
          )}

          {step === 'success' && (
            <div className="mt-6 space-y-4"><div className="rounded-[12px] bg-brand-soft p-4"><p className="font-bold text-title">Evento enviado para aprovação.</p><p className="mt-1 text-sm text-body">Nossa equipe vai revisar as informações antes de publicar na agenda.</p></div><div className="flex justify-end"><button type="button" onClick={close} className="h-10 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark">Concluído</button></div></div>
          )}
        </div>
      </dialog>
    </>
  );
}

function Field({ label, name, type = 'text', required = false, disabled = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; disabled?: boolean; placeholder?: string }) {
  return <label className="grid gap-1 text-sm font-medium text-body">{label}<input name={name} type={type} required={required} disabled={disabled} placeholder={placeholder} className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface focus:border-brand" /></label>;
}
