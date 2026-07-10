// Formatação em pt-BR (datas, moeda, texto).
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Fuso oficial do portal (horário de Brasília). Fixa a exibição das datas
// independentemente do fuso do servidor (Hostinger roda em UTC).
const SITE_TIME_ZONE = 'America/Sao_Paulo';

// Converte um instante para um Date cujos componentes LOCAIS já refletem o
// horário de Brasília. Assim o date-fns (que lê componentes locais) formata
// sempre no fuso do site, sem depender do TZ do runtime nem de libs extras.
function toSiteZone(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE_TIME_ZONE,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  }).formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return new Date(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
}

export function formatDate(value: string | Date, pattern = "d 'de' MMMM 'de' yyyy"): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return format(toSiteZone(date), pattern, { locale: ptBR });
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, "d 'de' MMMM 'de' yyyy 'às' HH'h'mm");
}

export function timeAgo(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
}

// Conectivos que permanecem minúsculos no meio de nomes próprios pt-BR.
const NAME_LOWER = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);

// Título em nomes próprios: "daniel bezerra" → "Daniel Bezerra",
// preservando conectivos ("maria da silva" → "Maria da Silva").
export function titleCase(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && NAME_LOWER.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
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
