'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import Icon from '@/components/Icon';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { deleteManualAd, saveManualAd, setManualAdActive, updateManualAdEndAt } from '@/features/admin/manualAdActions';
import type { ManualAdRow, ManualPlacementStatus } from '@/features/admin/manualAdQueries';
import { getAdInventoryItem, getAdUploadRatio, supportsAdDevice } from '@/lib/config/adInventory';
import type { AdPlacement } from '@/types/database';

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialForm(placement: AdPlacement = 'home_top') {
  return {
    id: undefined as string | undefined,
    title: '',
    placement,
    mediaUrl: '',
    destinationUrl: '',
    startAt: toLocalInput(new Date().toISOString()),
    endAt: '',
    isActive: true,
  };
}

function isCurrentlyServing(ad: ManualAdRow) {
  const now = Date.now();
  return ad.is_active && new Date(ad.start_at).getTime() <= now && (!ad.end_at || new Date(ad.end_at).getTime() >= now);
}

function isCurrentOrScheduled(ad: ManualAdRow) {
  return ad.is_active && (!ad.end_at || new Date(ad.end_at).getTime() >= Date.now());
}

function formatPeriod(value?: string | null) {
  if (!value) return 'Sem término';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year = 1970, month = 1, day = 1] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function datePart(value: string) { return value.split('T')[0] ?? ''; }
function timePart(value: string) { return value.split('T')[1] ?? '00:00'; }
function setTimePart(value: string, time: string) { return `${datePart(value)}T${time}`; }

function formatDateLabel(value: string) {
  if (!value) return 'dd/mm/aaaa';
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
}

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function SingleDatePicker({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()));
  const leadingDays = (getDay(startOfMonth(month)) + 6) % 7;
  const days = Array.from({ length: getDaysInMonth(month) }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1));

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !calendarRef.current?.contains(target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    function closeOnResize() {
      setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('scroll', closeOnResize, true);
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('scroll', closeOnResize, true);
      window.removeEventListener('resize', closeOnResize);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      setMonth(startOfMonth(selected ?? new Date()));
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const calendarWidth = Math.min(300, window.innerWidth - 24);
        const calendarHeight = 310;
        const availableBelow = window.innerHeight - rect.bottom;
        const top = availableBelow >= calendarHeight + 8
          ? rect.bottom + 4
          : Math.max(8, rect.top - calendarHeight - 4);
        const left = Math.min(Math.max(8, rect.left), window.innerWidth - calendarWidth - 8);
        setPosition({ top, left });
      }
    }
    setOpen((current) => !current);
  }

  return <div ref={containerRef} className="relative min-w-0">
    <button type="button" onClick={toggle} aria-expanded={open} className="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-l-[9px] px-3 text-left text-sm text-title outline-none hover:bg-surface focus:bg-surface">
      <Icon icon="Calendar03Icon" size={18} className="shrink-0" />
      <span className={`truncate ${value ? '' : 'text-muted'}`}>{value ? formatDateLabel(value) : placeholder}</span>
    </button>
    {open && createPortal(<div ref={calendarRef} style={{ top: position.top, left: position.left }} className="fixed z-[100] w-[300px] max-w-[calc(100vw-1.5rem)] rounded-[10px] border border-line bg-card p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => setMonth((current) => addMonths(current, -1))} className="h-8 w-8 text-xl" aria-label="Mês anterior">‹</button><strong className="text-sm capitalize text-title">{format(month, 'MMMM yyyy', { locale: ptBR })}</strong><button type="button" onClick={() => setMonth((current) => addMonths(current, 1))} className="h-8 w-8 text-xl" aria-label="Próximo mês">›</button></div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted">{weekDays.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">{Array.from({ length: leadingDays }, (_, index) => <span key={`empty-${index}`} />)}{days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const active = key === value;
        return <button key={key} type="button" onClick={() => { onChange(key); setOpen(false); }} className={`h-8 rounded-[6px] text-sm ${active ? 'bg-[#2271b1] font-bold text-white' : 'text-title hover:bg-surface'}`}>{day.getDate()}</button>;
      })}</div>
    </div>, document.body)}
  </div>;
}

function DateTimeField({ value, onChange, placeholder = 'dd/mm/aaaa' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const date = datePart(value);
  const time = value ? timePart(value) : '00:00';
  return <div className="grid h-10 grid-cols-2 rounded-[10px] border border-line bg-card outline-none focus-within:border-brand">
    <SingleDatePicker value={date} placeholder={placeholder} onChange={(selectedDate) => onChange(`${selectedDate}T${time}`)} />
    <label className="flex h-full min-w-0 cursor-text items-center gap-2.5 rounded-r-[9px] border-l border-line px-3 text-sm text-title hover:bg-surface focus-within:bg-surface">
      <Icon icon="Clock01Icon" size={18} className="shrink-0" />
      <input aria-label="Horário" type="time" step="60" value={time} onChange={(event) => date && onChange(setTimePart(value, event.target.value))} className="h-full min-w-0 flex-1 cursor-text bg-transparent text-sm text-title outline-none disabled:cursor-not-allowed disabled:text-muted" disabled={!date} />
    </label>
  </div>;
}

export default function ManualAdManager({ placements }: { placements: ManualPlacementStatus[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [endDateAd, setEndDateAd] = useState<ManualAdRow | null>(null);
  const [endDateValue, setEndDateValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inventory = getAdInventoryItem(form.placement);
  const imageDevice = supportsAdDevice(form.placement, 'desktop') ? 'desktop' : 'mobile';

  function openNew(placement: AdPlacement) {
    setForm(initialForm(placement));
    setError(null);
    setOpen(true);
  }

  function openEdit(ad: ManualAdRow) {
    setForm({
      id: ad.id,
      title: ad.title,
      placement: ad.placement,
      mediaUrl: ad.desktop_media_url ?? ad.mobile_media_url ?? '',
      destinationUrl: ad.destination_url ?? '',
      startAt: toLocalInput(ad.start_at),
      endAt: toLocalInput(ad.end_at),
      isActive: ad.is_active,
    });
    setError(null);
    setOpen(true);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveManualAd(form);
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  }

  function toggle(ad: ManualAdRow) {
    setError(null);
    startTransition(async () => {
      const result = await setManualAdActive(ad.id, !ad.is_active);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function remove(ad: ManualAdRow) {
    if (!window.confirm(`Excluir permanentemente “${ad.title}”?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteManualAd(ad.id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function openEndDateEditor(ad: ManualAdRow) {
    setEndDateAd(ad);
    setEndDateValue(toLocalInput(ad.end_at));
    setError(null);
  }

  function saveEndDate(value: string) {
    if (!endDateAd) return;
    setError(null);
    startTransition(async () => {
      const result = await updateManualAdEndAt(endDateAd.id, value);
      if (!result.ok) return setError(result.error);
      setEndDateAd(null);
      router.refresh();
    });
  }

  return <div className="space-y-5">
    <header>
      <h1 className="font-headline text-2xl font-extrabold text-title">Publicidade manual</h1>
      <p className="mt-1 text-sm text-muted">Veja a ocupação dos espaços e adicione banners institucionais ou temporários sem contrato.</p>
    </header>

    {error && !open && <p role="alert" className="border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}

    <section className="admin-table-wrap">
      <table className="admin-table min-w-[1080px] [&_td]:align-middle [&_th]:align-middle">
        <thead><tr><th>Formato disponível</th><th>Tamanho</th><th>Status</th><th>Início</th><th>Término</th><th>Ações</th></tr></thead>
        <tbody>{placements.map((placement) => {
          const paidAd = placement.paidAds[0];
          const manualAd = placement.manualAds.find(isCurrentOrScheduled);
          const status = paidAd ? 'Pago' : manualAd ? 'Manual' : 'Nenhum';
          const periodStart = paidAd?.startAt ?? manualAd?.start_at ?? null;
          const periodEnd = paidAd?.endAt ?? manualAd?.end_at ?? null;
          return <tr key={placement.code}>
            <td><strong className="text-title">{placement.name}</strong></td>
            <td className="whitespace-nowrap text-sm text-body">{placement.desktop}</td>
            <td>
              <span className={`inline-flex items-center gap-1.5 font-bold ${status === 'Pago' ? 'text-[#2271b1]' : status === 'Manual' ? 'text-brand-dark' : 'text-muted'}`}>
                <span aria-hidden="true">{status === 'Nenhum' ? '○' : '●'}</span>{status}
              </span>
              {paidAd && <span className="mt-1 block max-w-40 truncate text-xs text-muted" title={paidAd.title}>{paidAd.title}</span>}
            </td>
            <td className="whitespace-nowrap text-sm text-body">{periodStart ? formatPeriod(periodStart) : '—'}</td>
            <td className="whitespace-nowrap text-sm">
              {manualAd && !paidAd
                ? <button type="button" onClick={() => openEndDateEditor(manualAd)} className="font-bold text-[#2271b1] underline decoration-dotted underline-offset-4">{formatPeriod(periodEnd)}</button>
                : periodStart ? <span className="text-body">{formatPeriod(periodEnd)}</span> : <span className="text-muted">—</span>}
            </td>
            <td>
              {placement.manualAds.map((ad) => {
                const serving = isCurrentlyServing(ad);
                return <div key={ad.id} className="mb-1 flex flex-wrap items-center gap-1 text-xs"><span className="mr-auto max-w-40 truncate text-title" title={ad.title}>{serving ? '🔒 ' : ''}{ad.title}</span><button type="button" onClick={() => openEdit(ad)} disabled={serving || pending} className="px-1.5 font-bold text-brand disabled:text-muted">Editar</button><button type="button" onClick={() => toggle(ad)} disabled={pending} className="px-1.5 font-bold text-brand">{serving ? 'Encerrar' : ad.is_active ? 'Desativar' : 'Ativar'}</button><button type="button" onClick={() => remove(ad)} disabled={serving || pending} className="px-1.5 font-bold text-danger disabled:text-muted">Excluir</button></div>;
              })}
              <Button type="button" size="sm" variant="outline" onClick={() => openNew(placement.code)}>{placement.manualAds.length ? 'Novo manual' : 'Adicionar manual'}</Button>
            </td>
          </tr>;
        })}</tbody>
      </table>
    </section>

    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="manual-ad-modal-title">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/45" onClick={close} />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-card p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="manual-ad-modal-title" className="text-xl font-extrabold text-title">{form.id ? 'Editar banner manual' : 'Adicionar banner manual'}</h2><p className="mt-1 text-sm text-muted">Sem contrato, cobrança ou vínculo comercial.</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-body"><span><strong>Desktop:</strong> {inventory?.desktop}</span><span><strong>Mobile:</strong> {inventory?.mobile}</span></div></div><button type="button" onClick={close} className="text-2xl leading-none text-muted" aria-label="Fechar">×</button></div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome interno" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Campanha de vacinação" required />
          <Input label="Link de destino (opcional)" type="url" value={form.destinationUrl} onChange={(event) => setForm((current) => ({ ...current, destinationUrl: event.target.value }))} placeholder="https://" />
        </div>

        <fieldset className="mt-5 space-y-5">
          <div><span className="mb-2 block text-base font-extrabold text-title">Data de início</span><DateTimeField value={form.startAt} onChange={(value) => setForm((current) => ({ ...current, startAt: value }))} /></div>
          <div>
            <span className="mb-2 block text-base font-extrabold text-title">Data de término</span>
            <Checkbox label="Definir uma data de término" checked={Boolean(form.endAt)} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.checked ? toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()).slice(0, 10) + 'T00:00' : '' }))} />
            {form.endAt && <div className="mt-3"><DateTimeField value={form.endAt} onChange={(value) => setForm((current) => ({ ...current, endAt: value }))} /></div>}
          </div>
        </fieldset>

        <div className="mt-4"><ImageUploader compact bucket="ad-banners" prefix="manual" value={form.mediaUrl || null} onChange={(url) => setForm((current) => ({ ...current, mediaUrl: url ?? '' }))} label={`Imagem do banner — ${imageDevice === 'desktop' ? inventory?.desktop : inventory?.mobile}`} ratio={getAdUploadRatio(form.placement, imageDevice)} /></div>

        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={close}>Cancelar</Button><Button disabled={pending}>{pending ? 'Salvando…' : 'Salvar banner'}</Button></div>
      </form>
    </div>}

    {endDateAd && <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="manual-ad-end-date-title">
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/45" onClick={() => !pending && setEndDateAd(null)} />
      <div className="relative w-full max-w-lg bg-card p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3"><div><h2 id="manual-ad-end-date-title" className="text-xl font-extrabold text-title">Alterar data de término</h2><p className="mt-1 text-sm text-muted">{endDateAd.title}</p></div><button type="button" onClick={() => setEndDateAd(null)} className="text-2xl leading-none text-muted" aria-label="Fechar">×</button></div>
        <DateTimeField value={endDateValue} onChange={setEndDateValue} />
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" onClick={() => saveEndDate('')} disabled={pending || !endDateAd.end_at}>Remover término</Button>
          <div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setEndDateAd(null)} disabled={pending}>Cancelar</Button><Button type="button" onClick={() => saveEndDate(endDateValue)} disabled={pending || !endDateValue}>{pending ? 'Salvando…' : 'Salvar data'}</Button></div>
        </div>
      </div>
    </div>}
  </div>;
}
