'use client';

import { addMonths, format, getDay, getDaysInMonth, isAfter, isBefore, isSameDay, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

interface EventDateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function formatDate(value: string) {
  return format(toDate(value), "d 'de' MMM 'de' yyyy", { locale: ptBR });
}

export default function EventDateRangePicker({ startDate, endDate, onChange }: EventDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startDate ? startOfMonth(toDate(startDate)) : startOfMonth(new Date()));
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedStartDate = open ? draftStartDate : startDate;
  const selectedEndDate = open ? draftEndDate : endDate;
  const start = selectedStartDate ? toDate(selectedStartDate) : null;
  const end = selectedEndDate ? toDate(selectedEndDate) : null;
  const rangeLabel = startDate
    ? endDate ? `${formatDate(startDate)} a ${formatDate(endDate)}` : formatDate(startDate)
    : 'Selecione a data do evento';

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function selectDay(day: Date) {
    const value = toKey(day);
    if (!start || end || isBefore(day, start) || isSameDay(day, start)) {
      setDraftStartDate(value);
      setDraftEndDate('');
    } else setDraftEndDate(value);
  }

  function toggle() {
    if (!open) {
      setDraftStartDate(startDate);
      setDraftEndDate(endDate);
    }
    setOpen((value) => !value);
  }

  function confirm() {
    onChange(draftStartDate, draftEndDate);
    setOpen(false);
  }

  return (
    <div ref={pickerRef} className="relative grid gap-1">
      <span className="text-sm font-medium text-body">Data do evento</span>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex h-9 w-full items-center gap-1.5 rounded-[10px] border border-line bg-card px-2.5 text-left text-xs font-medium text-body outline-none transition-colors hover:bg-surface focus:border-brand"
      >
        <Icon icon="Calendar03Icon" size={17} className="shrink-0 text-body" />
        <span className="min-w-0 flex-1 truncate">{rangeLabel}</span>
        <Icon icon="ArrowRight01Icon" size={14} className={`shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-30 w-[22rem] max-w-[calc(100vw-2rem)] rounded-[12px] border border-line bg-card p-2.5 shadow-xl">
          <div className="mb-1.5 flex items-center justify-between">
            <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, -1))} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface" aria-label="Mês anterior"><Icon icon="ArrowLeft01Icon" size={16} /></button>
            <button type="button" onClick={() => { setDraftStartDate(''); setDraftEndDate(''); }} className="text-[11px] font-bold text-brand hover:underline">Limpar</button>
            <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-surface" aria-label="Próximo mês"><Icon icon="ArrowRight01Icon" size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <CalendarMonth month={visibleMonth} start={start} end={end} onSelect={selectDay} />
            <CalendarMonth month={addMonths(visibleMonth, 1)} start={start} end={end} onSelect={selectDay} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
            <p className="text-[11px] leading-tight text-muted">Clique na data de início e depois na data de término.</p>
            <button type="button" disabled={!draftStartDate} onClick={confirm} className="h-7 shrink-0 rounded-full bg-brand px-3 text-[11px] font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">Definir data</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarMonth({ month, start, end, onSelect }: { month: Date; start: Date | null; end: Date | null; onSelect: (day: Date) => void }) {
  const leadingDays = (getDay(startOfMonth(month)) + 6) % 7;
  const days = Array.from({ length: getDaysInMonth(month) }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1));

  return (
    <div>
      <p className="mb-1 text-center text-xs font-extrabold capitalize text-title">{format(month, 'MMM yyyy', { locale: ptBR })}</p>
      <div className="grid grid-cols-7 text-center text-[10px] text-muted">{WEEK_DAYS.map((day) => <span key={day} className="py-0.5">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: leadingDays }, (_, index) => <span key={`empty-${index}`} />)}
        {days.map((day) => {
          const selectedStart = Boolean(start && isSameDay(day, start));
          const selectedEnd = Boolean(end && isSameDay(day, end));
          const inRange = Boolean(start && end && isAfter(day, start) && isBefore(day, end));
          return <button key={toKey(day)} type="button" onClick={() => onSelect(day)} className={`h-6 rounded-[6px] text-xs font-medium transition-colors ${selectedStart || selectedEnd ? 'bg-brand text-white' : inRange ? 'bg-brand-soft text-title' : 'text-body hover:bg-surface'}`}>{format(day, 'd')}</button>;
        })}
      </div>
    </div>
  );
}
