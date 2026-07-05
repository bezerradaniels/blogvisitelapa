// Configuração compartilhada da área de Comunidades (usável no client).
import type { CommunityCategory, ReportReason } from '@/types/database';

export const COMMUNITY_CATEGORIES: { value: CommunityCategory; label: string }[] = [
  { value: 'cidade', label: 'Cidade' },
  { value: 'religiosidade', label: 'Religiosidade' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'educacao', label: 'Educação' },
  { value: 'negocios', label: 'Negócios' },
  { value: 'humor', label: 'Humor' },
  { value: 'outros', label: 'Outros' },
];

export function communityCategoryLabel(value: string | null | undefined): string {
  return COMMUNITY_CATEGORIES.find((c) => c.value === value)?.label ?? 'Outros';
}

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'ofensivo', label: 'Conteúdo ofensivo' },
  { value: 'off_topic', label: 'Fora do tema' },
  { value: 'ilegal', label: 'Conteúdo ilegal' },
  { value: 'outro', label: 'Outro motivo' },
];

export function reportReasonLabel(value: string | null | undefined): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? 'Outro motivo';
}
