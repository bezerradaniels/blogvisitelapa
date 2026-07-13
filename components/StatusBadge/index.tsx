import Badge from '@/components/Badge';

const map: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  enviado_para_revisao: { label: 'Em revisão', tone: 'warning' },
  publicado: { label: 'Publicado', tone: 'success' },
  arquivado: { label: 'Arquivado', tone: 'neutral' },
  removido: { label: 'Removido', tone: 'danger' },
  pendente: { label: 'Pendente', tone: 'warning' },
  pendente_aprovacao: { label: 'Pendente de aprovação', tone: 'warning' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  rejeitado: { label: 'Rejeitado', tone: 'danger' },
  novo: { label: 'Novo', tone: 'info' },
  ativo: { label: 'Ativo', tone: 'success' },
  ativa: { label: 'Ativa', tone: 'success' },
  agendado: { label: 'Agendado', tone: 'info' },
  agendada: { label: 'Agendada', tone: 'info' },
  pausado: { label: 'Pausado', tone: 'warning' },
  pausada: { label: 'Pausada', tone: 'warning' },
  expirado: { label: 'Expirado', tone: 'danger' },
  expirada: { label: 'Expirada', tone: 'danger' },
  concluido: { label: 'Concluído', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
  aguardando_midia: { label: 'Aguardando mídia', tone: 'warning' },
  em_revisao: { label: 'Em revisão', tone: 'warning' },
  rejeitada: { label: 'Rejeitada', tone: 'danger' },
  parcial: { label: 'Parcial', tone: 'info' },
  pago: { label: 'Pago', tone: 'success' },
  atrasado: { label: 'Em atraso', tone: 'danger' },
  estornado: { label: 'Estornado', tone: 'danger' },
  nao_configurado: { label: 'Não configurado', tone: 'neutral' },
  aguardando_materiais: { label: 'Aguardando materiais', tone: 'warning' },
  pronto: { label: 'Pronto', tone: 'info' },
  em_andamento: { label: 'Em andamento', tone: 'info' },
  entregue: { label: 'Entregue', tone: 'success' },
};

// Selo de status genérico para tabelas do painel.
export default function StatusBadge({ status }: { status: string }) {
  const cfg = map[status] ?? { label: status, tone: 'neutral' as const };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
