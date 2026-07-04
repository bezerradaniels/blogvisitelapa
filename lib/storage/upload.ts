'use client';

// Upload de imagens para o Supabase Storage (client-side).
// Valida tipo e tamanho, gera nome seguro e retorna a URL pública.
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/format';

export type UploadBucket =
  | 'post-covers'
  | 'post-gallery'
  | 'ad-banners'
  | 'user-avatars'
  | 'sponsored-content';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export interface UploadResult {
  url: string | null;
  error: string | null;
}

// Gera um caminho seguro: [prefixo/]timestamp-random-nome.ext
function safePath(fileName: string, prefix?: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot >= 0 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg';
  const base = slugify(dot >= 0 ? fileName.slice(0, dot) : fileName).slice(0, 40) || 'img';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `${unique}-${base}.${ext}`;
  return prefix ? `${prefix}/${name}` : name;
}

export async function uploadImage(
  file: File,
  bucket: UploadBucket,
  prefix?: string,
): Promise<UploadResult> {
  if (!ALLOWED.includes(file.type)) {
    return { url: null, error: 'Formato inválido. Use JPG, PNG, WEBP, AVIF ou GIF.' };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'Imagem muito grande (máx. 5 MB).' };
  }

  const supabase = createClient();
  const path = safePath(file.name, prefix);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    return { url: null, error: 'Falha no upload. Verifique sua conexão e permissões.' };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
