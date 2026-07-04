// Formatação em pt-BR (datas, moeda, texto).
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(value: string | Date, pattern = "d 'de' MMMM 'de' yyyy"): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return format(date, pattern, { locale: ptBR });
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, "d 'de' MMMM 'de' yyyy 'às' HH'h'mm");
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Gera slug amigável a partir de um texto.
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Trunca respeitando limite de caracteres (útil para descrições de SEO).
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}
