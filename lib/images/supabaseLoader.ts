import type { ImageLoaderProps } from 'next/image';

const PUBLIC_OBJECT_PATH = '/storage/v1/object/public/';
const SIGNED_OBJECT_PATH = '/storage/v1/object/sign/';

/**
 * Entrega imagens do Supabase pelo CDN de transformação do próprio Storage.
 * Isso preserva os tamanhos responsivos do next/image sem consumir CPU e
 * memória do servidor Node por meio da rota /_next/image.
 */
export default function supabaseLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    return src;
  }

  const url = new URL(src);
  if (url.pathname.includes(PUBLIC_OBJECT_PATH)) {
    url.pathname = url.pathname.replace(PUBLIC_OBJECT_PATH, '/storage/v1/render/image/public/');
  } else if (url.pathname.includes(SIGNED_OBJECT_PATH)) {
    url.pathname = url.pathname.replace(SIGNED_OBJECT_PATH, '/storage/v1/render/image/sign/');
  } else {
    return src;
  }

  url.searchParams.set('width', String(width));
  url.searchParams.set('quality', String(quality ?? 75));
  return url.toString();
}
