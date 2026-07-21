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
  const pickerRef = useRef<HTMLDivElement>(null);

  const start = startDate ? toDate(startDate) : null;
  const end = endDate ? toDate(endDate) : null;
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
    if (!start || end || isBefore(day, start)) onChange(value, '');
    else if (isSameDay(day, start)) onChange(value, '');
    else {
      onChange(startDate, value);
      setOpen(false);
    }
  }

  return (
    <div ref={pickerRef} className="relative grid gap-1">
      <span className="text-sm font-medium text-body">Data do evento</span>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-line bg-card px-3 text-left text-sm font-medium text-body outline-none transition-colors hover:bg-surface focus:border-brand"
      >
        <Icon icon="Calendar03Icon" size={19} className="shrink-0 text-body" />
        <span className="min-w-0 flex-1 truncate">{rangeLabel}</span>
        <Icon icon="ArrowRight01Icon" size={16} className={`shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[27.2rem] max-w-[calc(100vw-3rem)] rounded-[14px] border border-line bg-card p-3 shadow-xl sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, -1))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface" aria-label="Mês anterior"><Icon icon="ArrowLeft01Icon" size={18} /></button>
            <button type="button" onClick={() => onChange('', '')} className="text-xs font-bold text-brand hover:underline">Limpar</button>
            <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface" aria-label="Próximo mês"><Icon icon="ArrowRight01Icon" size={18} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CalendarMonth month={visibleMonth} start={start} end={end} onSelect={selectDay} />
            <CalendarMonth month={addMonths(visibleMonth, 1)} start={start} end={end} onSelect={selectDay} />
          </div>
          <p className="mt-3 text-xs text-muted">Selecione a data de início e, se necessário, a data de término.</p>
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
      <p className="mb-2 text-center text-sm font-extrabold capitalize text-title">{format(month, 'MMM yyyy', { locale: ptBR })}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-muted">{WEEK_DAYS.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: leadingDays }, (_, index) => <span key={`empty-${index}`} />)}
        {days.map((day) => {
          const selectedStart = Boolean(start && isSameDay(day, start));
          const selectedEnd = Boolean(end && isSameDay(day, end));
          const inRange = Boolean(start && end && isAfter(day, start) && isBefore(day, end));
          return <button key={toKey(day)} type="button" onClick={() => onSelect(day)} className={`h-8 rounded-[8px] text-sm font-medium transition-colors ${selectedStart || selectedEnd ? 'bg-brand text-white' : inRange ? 'bg-brand-soft text-title' : 'text-body hover:bg-surface'}`}>{format(day, 'd')}</button>;
        })}
      </div>
    </div>
  );
}
