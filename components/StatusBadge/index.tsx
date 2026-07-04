import Badge from '@/components/Badge';

const map: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  enviado_para_revisao: { label: 'Em revisão', tone: 'warning' },
  publicado: { label: 'Publicado', tone: 'success' },
  arquivado: { label: 'Arquivado', tone: 'neutral' },
  removido: { label: 'Removido', tone: 'danger' },
  pendente: { label: 'Pendente', tone: 'warning' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  rejeitado: { label: 'Rejeitado', tone: 'danger' },
  novo: { label: 'Novo', tone: 'info' },
  ativo: { label: 'Ativo', tone: 'success' },
  pausado: { label: 'Pausado', tone: 'warning' },
  expirado: { label: 'Expirado', tone: 'danger' },
};

// Selo de status genérico para tabelas do painel.
export default function StatusBadge({ status }: { status: string }) {
  const cfg = map[status] ?? { label: status, tone: 'neutral' as const };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
