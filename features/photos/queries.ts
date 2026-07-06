import 'server-only';

// Consultas de álbuns/fotos (RLS: leitura segue can_view_profile).
// As URLs das fotos são assinadas no servidor: as linhas já passaram pela RLS
// (can_view_profile), então gerar signed URLs aqui é seguro por construção e
// permite manter o bucket `user-photos` privado — as fotos respeitam a
// visibilidade do perfil mesmo no acesso direto ao arquivo.
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { AlbumWithCount, Photo, PhotoAlbum } from '@/types/photos';

const PHOTO_BUCKET = 'user-photos';
const SIGNED_TTL_SECONDS = 60 * 60; // 1 hora

// Extrai o caminho do objeto a partir da URL salva no banco.
function pathFromUrl(url: string): string | null {
  const marker = `/${PHOTO_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length).split('?')[0] || null;
}

// Assina em lote; em caso de falha (ex.: sem service role em dev), devolve as
// URLs originais para degradar sem quebrar o layout.
async function signUrls(urls: (string | null)[]): Promise<(string | null)[]> {
  const paths = urls.map((u) => (u ? pathFromUrl(u) : null));
  const toSign = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  if (toSign.length === 0) return urls;

  try {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(toSign, SIGNED_TTL_SECONDS);
    const map = new Map<string, string>();
    (data ?? []).forEach((d) => {
      if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
    });
    return urls.map((u, idx) => {
      const p = paths[idx];
      return p ? map.get(p) ?? u : u;
    });
  } catch {
    return urls;
  }
}

export async function listAlbums(profileId: string): Promise<AlbumWithCount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('photo_albums')
    .select('*, photos(count)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(100);

  const albums = ((data ?? []) as unknown as (PhotoAlbum & { photos: { count: number }[] })[]).map(
    (a) => ({
      ...a,
      photo_count: a.photos?.[0]?.count ?? 0,
    }),
  );

  const signed = await signUrls(albums.map((a) => a.cover_url));
  return albums.map((a, i) => ({ ...a, cover_url: signed[i] ?? a.cover_url }));
}

export async function getAlbum(albumId: string): Promise<PhotoAlbum | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('photo_albums').select('*').eq('id', albumId).maybeSingle();
  return (data as PhotoAlbum) ?? null;
}

export async function listPhotos(albumId: string): Promise<Photo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('photos')
    .select('*')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(500);

  const photos = (data ?? []) as Photo[];
  const signed = await signUrls(photos.map((p) => p.url));
  return photos.map((p, i) => ({ ...p, url: signed[i] ?? p.url }));
}
