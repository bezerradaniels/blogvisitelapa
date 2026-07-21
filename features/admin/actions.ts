'use server';

// Server Actions administrativas (moderação). Sempre exigem admin (checagem +
// RLS). Registram trilha de auditoria.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils/format';
import type { TablesUpdate } from '@/types/database';

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

const quickPostEditSchema = z.object({
  postId: z.string().uuid(),
  title: z.string().trim().min(3, 'Informe um título com pelo menos 3 caracteres.'),
  slug: z.string().trim().min(1, 'Informe um slug.'),
  authorId: z.string().uuid('Selecione um autor válido.'),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
});

export type QuickPostEditInput = z.input<typeof quickPostEditSchema>;

// Atualiza apenas os campos exibidos no modal de edição rápida.
export async function quickEditPost(input: QuickPostEditInput): Promise<AdminActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };

  const parsed = quickPostEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const { postId, title, authorId, publishedAt } = parsed.data;
  const slug = slugify(parsed.data.slug);
  if (!slug) return { ok: false, error: 'Informe um slug válido.' };

  const { supabase, profileId } = ctx;
  const [{ data: post }, { data: author }, { data: slugConflict }] = await Promise.all([
    supabase.from('posts').select('slug').eq('id', postId).maybeSingle(),
    supabase.from('profiles').select('id').eq('id', authorId).eq('status', 'active').in('role', ['publisher', 'admin']).maybeSingle(),
    supabase.from('posts').select('id').eq('slug', slug).neq('id', postId).maybeSingle(),
  ]);

  if (!post) return { ok: false, error: 'Post não encontrado.' };
  if (!author) return { ok: false, error: 'O autor selecionado não está disponível.' };
  if (slugConflict) return { ok: false, error: 'Este slug já está em uso.' };

  const update: TablesUpdate<'posts'> = { title, slug, author_id: authorId, published_at: publishedAt };
  const { error } = await supabase.from('posts').update(update).eq('id', postId);
  if (error) return { ok: false, error: 'Não foi possível atualizar o post.' };

  await logAudit(supabase, profileId, 'post.quick_edit', 'posts', postId);
  revalidatePath('/admin/posts');
  revalidatePath(`/post/${post.slug}`);
  revalidatePath(`/post/${slug}`);
  revalidatePath('/');
  return { ok: true };
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
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };
  const { supabase, profileId } = ctx;

  const update: TablesUpdate<'posts'> = { reviewed_by: profileId };

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

  await logAudit(supabase, profileId, `post.${action}`, 'posts', postId);

  revalidatePath('/admin/posts');
  revalidatePath('/');
  return { ok: true };
}

export type EventSubmissionModerationAction = 'aprovar' | 'rejeitar';

function eventDescriptionToHtml(description: string): string {
  const escape = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return description
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export async function moderateEventSubmission(
  submissionId: string,
  action: EventSubmissionModerationAction,
): Promise<AdminActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };
  if (!z.string().uuid().safeParse(submissionId).success) return { ok: false, error: 'Envio inválido.' };

  const { supabase, profileId } = ctx;
  const { data: submission } = await supabase
    .from('event_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (!submission) return { ok: false, error: 'Envio não encontrado.' };
  if (submission.status !== 'pendente') return { ok: false, error: 'Este envio já foi analisado.' };

  if (action === 'rejeitar') {
    const { error } = await supabase.from('event_submissions').update({
      status: 'rejeitado', reviewed_by: profileId, reviewed_at: new Date().toISOString(),
    }).eq('id', submissionId);
    if (error) return { ok: false, error: 'Não foi possível rejeitar o envio.' };
    await logAudit(supabase, profileId, 'event_submission.reject', 'event_submissions', submissionId);
    revalidatePath('/admin/eventos-enviados');
    return { ok: true };
  }

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'eventos')
    .maybeSingle();
  const slugBase = slugify(submission.title) || 'evento';
  const slug = `${slugBase}-${submission.id.slice(0, 8)}`;
  const { data: post, error: insertError } = await supabase.from('posts').insert({
    title: submission.title,
    slug,
    excerpt: submission.description.slice(0, 280),
    content_html: eventDescriptionToHtml(submission.description),
    category_id: category?.id ?? null,
    author_id: profileId,
    reviewed_by: profileId,
    status: 'publicado',
    moderation_status: 'aprovado',
    content_type: 'evento',
    is_event: true,
    event_start_date: submission.event_start_date,
    event_end_date: submission.event_end_date,
    event_location: submission.event_location,
    event_address: submission.event_address,
    event_ticket_price: submission.event_ticket_price,
    event_organizer: submission.event_organizer,
    event_is_free: submission.event_is_free,
    published_at: new Date().toISOString(),
  }).select('id').single();
  if (insertError || !post) return { ok: false, error: 'Não foi possível publicar o evento.' };

  const { error: updateError } = await supabase.from('event_submissions').update({
    status: 'aprovado', reviewed_by: profileId, reviewed_at: new Date().toISOString(), published_post_id: post.id,
  }).eq('id', submissionId);
  if (updateError) return { ok: false, error: 'O evento foi publicado, mas não foi possível atualizar o envio.' };

  await logAudit(supabase, profileId, 'event_submission.approve', 'event_submissions', submissionId);
  revalidatePath('/admin/eventos-enviados');
  revalidatePath('/eventos');
  revalidatePath('/');
  return { ok: true };
}

export type CommentModerationAction = 'aprovar' | 'rejeitar' | 'remover';

export async function moderateComment(
  commentId: string,
  action: CommentModerationAction,
): Promise<AdminActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito a administradores.' };
  const { supabase, profileId } = ctx;

  const status =
    action === 'aprovar' ? 'aprovado' : action === 'rejeitar' ? 'rejeitado' : 'removido';

  const { error: err } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', commentId);
  if (err) return { ok: false, error: 'Não foi possível moderar o comentário.' };

  await logAudit(supabase, profileId, `comment.${action}`, 'comments', commentId);

  revalidatePath('/admin/comentarios');
  return { ok: true };
}
