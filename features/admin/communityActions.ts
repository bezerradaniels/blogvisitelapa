'use server';

// Server Actions administrativas para Comunidades e Denúncias.
// Exigem admin (checagem + RLS) e registram trilha de auditoria.
import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import { createClient } from '@/lib/supabase/server';
import type { CommunityStatus } from '@/types/database';

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
) {
  await supabase.from('audit_logs').insert({ actor_id: actorId, action, entity, entity_id: entityId });
}

export async function setCommunityStatus(
  communityId: string,
  status: CommunityStatus,
): Promise<AdminActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };
  const { supabase, profileId } = ctx;

  const { error: err } = await supabase
    .from('communities')
    .update({ status })
    .eq('id', communityId);
  if (err) return { ok: false, error: 'Não foi possível atualizar a comunidade.' };

  await logAudit(supabase, profileId, `community_${status}`, 'community', communityId);
  revalidatePath('/admin/comunidades');
  revalidatePath(`/admin/comunidades/${communityId}`);
  revalidatePath('/comunidades');
  return { ok: true };
}

// Resolve (ou descarta) uma denúncia.
export async function resolveReport(
  reportId: string,
  action: 'resolver' | 'descartar',
): Promise<AdminActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };
  const { supabase, profileId } = ctx;

  const { error: err } = await supabase
    .from('community_reports')
    .update({
      status: action === 'resolver' ? 'resolvida' : 'descartada',
      resolved_by: profileId,
    })
    .eq('id', reportId);
  if (err) return { ok: false, error: 'Não foi possível atualizar a denúncia.' };

  await logAudit(supabase, profileId, `report_${action}`, 'community_report', reportId);
  revalidatePath('/admin/denuncias');
  return { ok: true };
}

// Remove o conteúdo denunciado e marca a denúncia como resolvida.
export async function removeReportedContent(
  reportId: string,
  targetType: 'comunidade' | 'topico' | 'resposta',
  targetId: string,
): Promise<AdminActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };
  const { supabase, profileId } = ctx;

  let err;
  if (targetType === 'comunidade') {
    ({ error: err } = await supabase.from('communities').update({ status: 'suspensa' }).eq('id', targetId));
  } else if (targetType === 'topico') {
    ({ error: err } = await supabase.from('community_topics').update({ status: 'removido' }).eq('id', targetId));
  } else {
    ({ error: err } = await supabase.from('community_replies').update({ status: 'removido' }).eq('id', targetId));
  }
  if (err) return { ok: false, error: 'Não foi possível remover o conteúdo.' };

  await supabase
    .from('community_reports')
    .update({ status: 'resolvida', resolved_by: profileId })
    .eq('id', reportId);

  await logAudit(supabase, profileId, `report_removed_${targetType}`, 'community_report', reportId);
  revalidatePath('/admin/denuncias');
  revalidatePath('/comunidades');
  return { ok: true };
}
