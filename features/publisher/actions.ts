'use server';

// Server Action para criar/editar posts a partir do frontend.
// Regras: sanitiza HTML no servidor, gera slug único, aplica status por ação e
// respeita a autorização (RLS + checagem de papel). Publishers aprovados
// (papel publisher ativo) podem publicar direto.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { sanitizePostHtml } from '@/lib/utils/sanitize';
import { slugify } from '@/lib/utils/format';
import type { Json, TablesInsert, TablesUpdate } from '@/types/database';

const galleryItemSchema = z.object({ url: z.string().url(), alt: z.string().optional().default('') });

const postSchema = z.object({
  id: z.string().uuid().optional(),
  action: z.enum(['rascunho', 'enviar', 'publicar']),

  title: z.string().min(3, 'O título é obrigatório.'),
  subtitle: z.string().optional().default(''),
  slug: z.string().optional().default(''),
  excerpt: z.string().optional().default(''),
  content_html: z.string().optional().default(''),
  content_json: z.unknown().optional(),

  cover_image_url: z.string().url().optional().or(z.literal('')).default(''),
  cover_image_alt: z.string().optional().default(''),
  gallery: z.array(galleryItemSchema).optional().default([]),

  category_id: z.string().uuid().optional().or(z.literal('')).default(''),
  content_type: z.enum([
    'noticia', 'evento', 'guia', 'publieditorial',
    'conteudo_patrocinado', 'comunidade', 'turismo', 'religiosidade',
  ]),
  tags: z.string().optional().default(''), // separadas por vírgula

  is_featured: z.boolean().optional().default(false),
  is_sponsored: z.boolean().optional().default(false),
  is_event: z.boolean().optional().default(false),

  event_start_date: z.string().optional().default(''),
  event_end_date: z.string().optional().default(''),
  event_location: z.string().optional().default(''),
  event_address: z.string().optional().default(''),
  event_ticket_url: z.string().optional().default(''),
  event_organizer: z.string().optional().default(''),
  event_map_url: z.string().optional().default(''),

  source_note: z.string().optional().default(''),
  editorial_notes: z.string().optional().default(''),

  seo_title: z.string().optional().default(''),
  seo_description: z.string().optional().default(''),
  focus_keyword: z.string().optional().default(''),
  local_seo_keyword: z.string().optional().default(''),
  social_title: z.string().optional().default(''),
  social_description: z.string().optional().default(''),
  social_image_url: z.string().optional().default(''),
  allow_indexing: z.boolean().optional().default(true),
  include_in_sitemap: z.boolean().optional().default(true),
  include_in_rss: z.boolean().optional().default(true),
});

export type PostInput = z.input<typeof postSchema>;

export interface SaveResult {
  ok: boolean;
  error?: string;
  slug?: string;
  id?: string;
}

const nullify = (v: string) => (v.trim() === '' ? null : v.trim());

// Host do Supabase Storage (único permitido no next/image). URLs de capa/galeria
// fora desse host quebrariam a renderização — por isso são rejeitadas.
function supabaseHost(): string | null {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return u ? new URL(u).hostname : null;
  } catch {
    return null;
  }
}
function isSiteHostedImage(url: string): boolean {
  const host = supabaseHost();
  if (!host) return true; // sem config (dev), não bloqueia
  try {
    return new URL(url).hostname === host;
  } catch {
    return false;
  }
}

export async function savePost(input: PostInput): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user?.isPublisher || !user.profile) {
    return { ok: false, error: 'Acesso restrito a publishers.' };
  }

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const d = parsed.data;

  // Capa e galeria são renderizadas via next/image (só o host do Supabase é
  // permitido). Bloqueia URLs externas para não quebrar a imagem no site.
  // A imagem social (OG) pode ser externa — só aparece em meta tags.
  const coverToCheck = nullify(d.cover_image_url);
  if (coverToCheck && !isSiteHostedImage(coverToCheck)) {
    return { ok: false, error: 'A imagem de capa deve ser enviada pelo site (upload).' };
  }
  if (d.gallery.some((item) => !isSiteHostedImage(item.url))) {
    return { ok: false, error: 'As imagens da galeria devem ser enviadas pelo site (upload).' };
  }

  const supabase = await createClient();

  // Slug único (a partir do título quando vazio).
  const baseSlug = slugify(d.slug || d.title);
  const slug = await ensureUniqueSlug(supabase, baseSlug || `post-${Date.now()}`, d.id);

  // Status/moderação conforme a ação.
  let status: TablesInsert<'posts'>['status'] = 'rascunho';
  let moderation_status: TablesInsert<'posts'>['moderation_status'] = 'pendente';
  let published_at: string | null = null;
  if (d.action === 'enviar') {
    status = 'enviado_para_revisao';
    moderation_status = 'pendente';
  } else if (d.action === 'publicar') {
    status = 'publicado';
    moderation_status = 'aprovado';
    published_at = new Date().toISOString();
  }

  const safeHtml = d.content_html ? sanitizePostHtml(d.content_html) : null;

  const payload: TablesInsert<'posts'> = {
    author_id: user.profile.id,
    title: d.title.trim(),
    subtitle: nullify(d.subtitle),
    slug,
    excerpt: nullify(d.excerpt),
    content_html: safeHtml,
    content_json: (d.content_json ?? null) as Json,
    cover_image_url: nullify(d.cover_image_url),
    cover_image_alt: nullify(d.cover_image_alt),
    category_id: d.category_id ? d.category_id : null,
    content_type: d.content_type,
    is_featured: d.is_featured,
    is_sponsored: d.is_sponsored,
    is_event: d.is_event,
    event_start_date: d.is_event ? nullify(d.event_start_date) : null,
    event_end_date: d.is_event ? nullify(d.event_end_date) : null,
    event_location: d.is_event ? nullify(d.event_location) : null,
    event_address: d.is_event ? nullify(d.event_address) : null,
    event_ticket_url: d.is_event ? nullify(d.event_ticket_url) : null,
    event_organizer: d.is_event ? nullify(d.event_organizer) : null,
    event_map_url: d.is_event ? nullify(d.event_map_url) : null,
    source_note: nullify(d.source_note),
    editorial_notes: nullify(d.editorial_notes),
    seo_title: nullify(d.seo_title),
    seo_description: nullify(d.seo_description),
    focus_keyword: nullify(d.focus_keyword),
    local_seo_keyword: nullify(d.local_seo_keyword),
    social_title: nullify(d.social_title),
    social_description: nullify(d.social_description),
    social_image_url: nullify(d.social_image_url),
    allow_indexing: d.allow_indexing,
    include_in_sitemap: d.include_in_sitemap,
    include_in_rss: d.include_in_rss,
    status,
    moderation_status,
  };

  let postId = d.id;

  // Na edição, guarda as imagens atuais para limpar as que forem substituídas.
  let oldImageUrls: string[] = [];
  if (d.id) {
    const [{ data: existingPost }, { data: existingGallery }] = await Promise.all([
      supabase.from('posts').select('cover_image_url').eq('id', d.id).maybeSingle(),
      supabase.from('post_gallery').select('url').eq('post_id', d.id),
    ]);
    oldImageUrls = [
      existingPost?.cover_image_url ?? null,
      ...(existingGallery ?? []).map((g) => g.url),
    ].filter((u): u is string => Boolean(u));
  }

  if (d.id) {
    // Edição: não reatribui o autor (admin pode editar post de terceiros).
    const update: TablesUpdate<'posts'> = { ...payload };
    delete update.author_id;
    // Só define published_at ao publicar (evita sobrescrever ao salvar rascunho).
    if (d.action === 'publicar') update.published_at = published_at;
    const { error } = await supabase.from('posts').update(update).eq('id', d.id);
    if (error) return { ok: false, error: 'Não foi possível salvar o post.' };
  } else {
    payload.published_at = published_at;
    const { data, error } = await supabase.from('posts').insert(payload).select('id').single();
    if (error || !data) return { ok: false, error: 'Não foi possível criar o post.' };
    postId = data.id;
  }

  if (!postId) return { ok: false, error: 'Falha ao identificar o post.' };

  await syncTags(supabase, postId, d.tags);
  await syncGallery(supabase, postId, d.gallery);

  // Remove do Storage a capa/galeria que deixaram de ser referenciadas.
  if (oldImageUrls.length > 0) {
    const keep = new Set<string>();
    const newCover = nullify(d.cover_image_url);
    if (newCover) keep.add(newCover);
    const newSocial = nullify(d.social_image_url);
    if (newSocial) keep.add(newSocial);
    for (const item of d.gallery) keep.add(item.url);
    const orphans = oldImageUrls.filter((u) => !keep.has(u));
    if (orphans.length > 0) await removeOrphanFiles(supabase, orphans);
  }

  revalidatePath('/');
  revalidatePath('/publisher');
  revalidatePath(`/post/${slug}`);

  return { ok: true, slug, id: postId };
}

// --- helpers ---------------------------------------------------------

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function ensureUniqueSlug(
  supabase: ServerClient,
  base: string,
  currentId?: string,
): Promise<string> {
  let candidate = base;
  let n = 1;
  // Tenta até achar um slug livre (limite defensivo).
  while (n < 50) {
    const { data } = await supabase.from('posts').select('id').eq('slug', candidate).maybeSingle();
    if (!data || data.id === currentId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

async function syncTags(supabase: ServerClient, postId: string, raw: string) {
  const names = Array.from(
    new Set(
      raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  );

  await supabase.from('post_tags').delete().eq('post_id', postId);
  if (names.length === 0) return;

  const tagIds: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const { data: existing } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      tagIds.push(existing.id);
    } else {
      const { data: created } = await supabase.from('tags').insert({ name, slug }).select('id').single();
      if (created) tagIds.push(created.id);
    }
  }

  if (tagIds.length > 0) {
    await supabase.from('post_tags').insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
  }
}

// Buckets cujos arquivos pertencem ao post e podem ser removidos com segurança
// quando deixam de ser referenciados (evita deletar assets de outras áreas).
const POST_BUCKETS = new Set(['post-covers', 'post-gallery']);

// Extrai { bucket, path } de uma URL pública do Supabase Storage.
function parsePublicUrl(url: string): { bucket: string; path: string } | null {
  const marker = '/storage/v1/object/public/';
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const rest = url.slice(i + marker.length).split('?')[0] ?? '';
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
}

// Remove do Storage os arquivos que ficaram órfãos (capa/galeria substituídas).
// Só apaga arquivos dos buckets do post; ignora o resto silenciosamente.
async function removeOrphanFiles(supabase: ServerClient, urls: string[]) {
  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    const parsed = parsePublicUrl(url);
    if (!parsed || !POST_BUCKETS.has(parsed.bucket) || !parsed.path) continue;
    const list = byBucket.get(parsed.bucket) ?? [];
    list.push(parsed.path);
    byBucket.set(parsed.bucket, list);
  }
  for (const [bucket, paths] of byBucket) {
    if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
  }
}

async function syncGallery(
  supabase: ServerClient,
  postId: string,
  items: { url: string; alt: string }[],
) {
  await supabase.from('post_gallery').delete().eq('post_id', postId);
  if (items.length === 0) return;
  await supabase.from('post_gallery').insert(
    items.map((item, index) => ({
      post_id: postId,
      url: item.url,
      alt: item.alt || null,
      sort_order: index,
    })),
  );
}
