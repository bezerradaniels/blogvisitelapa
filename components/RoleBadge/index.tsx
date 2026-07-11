import Badge from '@/components/Badge';
import type { CommunityRole } from '@/types/database';

// Selo de papel na comunidade (Dono / Moderador). Membros comuns não recebem selo
// — só destacamos quem tem responsabilidade, sem poluir a lista.
const roleTone: Partial<Record<CommunityRole, 'highlight' | 'brand'>> = {
  dono: 'highlight',
  moderador: 'brand',
};

const roleLabel: Partial<Record<CommunityRole, string>> = {
  dono: 'Dono',
  moderador: 'Moderador',
};

export default function RoleBadge({
  role,
  className,
}: {
  role: CommunityRole | string | null | undefined;
  className?: string;
}) {
  const tone = roleTone[role as CommunityRole];
  const label = roleLabel[role as CommunityRole];
  if (!tone || !label) return null;
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
