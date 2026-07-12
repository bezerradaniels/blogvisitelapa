'use server';

// Server Actions de álbuns/fotos (dono gerencia; RLS reforça).
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface PhotoResult {
  ok: boolean;
  error?: string | null;
  id?: string;
}

async function requireProfile() {
  const user = await getCurrentUser();
  if (!user?.profile) return { me: null, slug: null, supabase: null, error: 'É preciso estar logado.' };
  const supabase = await createClient();
  return { me: user.profile.id, slug: user.profile.slug, supabase, error: null };
}

const albumSchema = z.object({ title: z.string().min(1, 'Dê um nome ao álbum.').max(120) });

export async function createAlbum(input: z.input<typeof albumSchema>): Promise<PhotoResult> {
  const { me, slug, supabase, error } = await requireProfile();
  if (!me || !supabase) return { ok: false, error };

  const parsed = albumSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  // Aplica a visibilidade padrão de mídia do usuário ao novo álbum (0027).
  const { data: cp } = await supabase
    .from('user_content_prefs')
    .select('default_album_visibility')
    .eq('profile_id', me)
    .maybeSingle();
  const visibility = cp?.default_album_visibility ?? 'amigos';

  const { data, error: err } = await supabase
    .from('photo_albums')
    .insert({ profile_id: me, title: parsed.data.title.trim(), visibility })
    .select('id')
    .maybeSingle();
  if (err || !data) return { ok: false, error: 'Não foi possível criar o álbum.' };

  if (slug) revalidatePath(`/u/${slug}/fotos`);
  return { ok: true, id: data.id };
}

export async function deleteAlbum(albumId: string): Promise<PhotoResult> {
  const { slug, supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase.from('photo_albums').delete().eq('id', albumId);
  if (err) return { ok: false, error: 'Não foi possível excluir o álbum.' };
  if (slug) revalidatePath(`/u/${slug}/fotos`);
  return { ok: true };
}

export async function addPhotos(albumId: string, urls: string[]): Promise<PhotoResult> {
  const { me, slug, supabase, error } = await requireProfile();
  if (!me || !supabase) return { ok: false, error };

  const clean = urls.filter((u) => /^https?:\/\//.test(u)).slice(0, 30);
  if (clean.length === 0) return { ok: false, error: 'Nenhuma foto para adicionar.' };

  const { error: err } = await supabase
    .from('photos')
    .insert(clean.map((url, i) => ({ album_id: albumId, profile_id: me, url, sort_order: i })));
  if (err) return { ok: false, error: 'Não foi possível adicionar as fotos.' };

  // Define capa do álbum se ainda não houver.
  const { data: album } = await supabase
    .from('photo_albums')
    .select('cover_url')
    .eq('id', albumId)
    .maybeSingle();
  if (album && !album.cover_url) {
    await supabase.from('photo_albums').update({ cover_url: clean[0] }).eq('id', albumId);
  }

  if (slug) revalidatePath(`/u/${slug}/fotos/${albumId}`);
  return { ok: true };
}

export async function deletePhoto(photoId: string): Promise<PhotoResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase.from('photos').delete().eq('id', photoId);
  if (err) return { ok: false, error: 'Não foi possível excluir a foto.' };
  return { ok: true };
}
