'use server';

// Ações admin para patrocínios (artigos e eventos patrocinados).
import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';

export type SponsoredKind = 'article' | 'event';

function pathFor(kind: SponsoredKind) {
  return kind === 'article' ? '/admin/publieditoriais' : '/admin/eventos-patrocinados';
}

export async function addSponsored(kind: SponsoredKind, postId: string, label: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const { supabase } = ctx;
  if (!postId) return { ok: false, error: 'Selecione um post.' };

  const defaultLabel = kind === 'article' ? 'Conteúdo patrocinado' : 'Evento patrocinado';
  const values = { post_id: postId, label: label.trim() || defaultLabel, is_active: true };

  const { error } =
    kind === 'article'
      ? await supabase.from('sponsored_articles').insert(values)
      : await supabase.from('sponsored_events').insert(values);
  if (error) return { ok: false, error: 'Não foi possível criar o patrocínio.' };

  // Marca o post como patrocinado.
  await supabase.from('posts').update({ is_sponsored: true }).eq('id', postId);
  revalidatePath(pathFor(kind));
  return { ok: true };
}

export async function toggleSponsored(kind: SponsoredKind, id: string, isActive: boolean) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  if (kind === 'article') {
    await supabase.from('sponsored_articles').update({ is_active: isActive }).eq('id', id);
  } else {
    await supabase.from('sponsored_events').update({ is_active: isActive }).eq('id', id);
  }
  revalidatePath(pathFor(kind));
  return { ok: true };
}

export async function removeSponsored(kind: SponsoredKind, id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  if (kind === 'article') {
    await supabase.from('sponsored_articles').delete().eq('id', id);
  } else {
    await supabase.from('sponsored_events').delete().eq('id', id);
  }
  revalidatePath(pathFor(kind));
  return { ok: true };
}
