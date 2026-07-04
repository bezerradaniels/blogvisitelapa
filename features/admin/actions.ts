'use server';

// Server Actions administrativas (moderação). Sempre exigem admin (checagem +
// RLS). Registram trilha de auditoria.
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { TablesUpdate } from '@/types/database';

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdminClient() {
  const user = await getCurrentUser();
  if (!user?.isAdmin || !user.profile) {
    return { user: null, supabase: null, error: 'Acesso restrito a administradores.' as const };
  }
  const supabase = await createClient();
  return { user, supabase, error: null };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
) {
  // Best-effort: falha de auditoria não deve derrubar a ação.
  await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
  });
}

export type PostModerationAction =
  | 'publicar'
  | 'aprovar'
  | 'rejeitar'
  | 'arquivar'
  | 'remover'
  | 'destaque_on'
  | 'destaque_off';

export async function moderatePost(
  postId: string,
  action: PostModerationAction,
): Promise<AdminActionResult> {
  const { user, supabase, error } = await requireAdminClient();
  if (!user || !supabase) return { ok: false, error };

  const update: TablesUpdate<'posts'> = { reviewed_by: user.profile!.id };

  switch (action) {
    case 'publicar':
    case 'aprovar':
      update.status = 'publicado';
      update.moderation_status = 'aprovado';
      update.published_at = new Date().toISOString();
      break;
    case 'rejeitar':
      update.moderation_status = 'rejeitado';
      break;
    case 'arquivar':
      update.status = 'arquivado';
      break;
    case 'remover':
      update.status = 'removido';
      break;
    case 'destaque_on':
      update.is_featured = true;
      break;
    case 'destaque_off':
      update.is_featured = false;
      break;
  }

  // Não sobrescreve published_at se já existir (aprovar/publicar de novo).
  if ((action === 'publicar' || action === 'aprovar')) {
    const { data: existing } = await supabase
      .from('posts')
      .select('published_at')
      .eq('id', postId)
      .maybeSingle();
    if (existing?.published_at) update.published_at = existing.published_at;
  }

  const { error: err } = await supabase.from('posts').update(update).eq('id', postId);
  if (err) return { ok: false, error: 'Não foi possível atualizar o post.' };

  await logAudit(supabase, user.profile!.id, `post.${action}`, 'posts', postId);

  revalidatePath('/admin/posts');
  revalidatePath('/');
  return { ok: true };
}

export type CommentModerationAction = 'aprovar' | 'rejeitar' | 'remover';

export async function moderateComment(
  commentId: string,
  action: CommentModerationAction,
): Promise<AdminActionResult> {
  const { user, supabase, error } = await requireAdminClient();
  if (!user || !supabase) return { ok: false, error };

  const status =
    action === 'aprovar' ? 'aprovado' : action === 'rejeitar' ? 'rejeitado' : 'removido';

  const { error: err } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', commentId);
  if (err) return { ok: false, error: 'Não foi possível moderar o comentário.' };

  await logAudit(supabase, user.profile!.id, `comment.${action}`, 'comments', commentId);

  revalidatePath('/admin/comentarios');
  return { ok: true };
}
