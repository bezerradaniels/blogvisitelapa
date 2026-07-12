'use server';

// Server Actions das Configurações. A autorização real é da RLS (0022);
// aqui há validação (Zod), regras de username e persistência.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isFieldKey, PROFILE_FIELDS, type FieldKey } from '@/lib/privacy/fields';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils/format';
import type { ProfileVisibility } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string | null;
  slug?: string;
}

async function requireProfile() {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return { profileId: null, slug: null, supabase: null, error: 'É preciso estar logado.' };
  }
  const supabase = await createClient();
  return { profileId: user.profile.id, slug: user.profile.slug, supabase, error: null };
}

// Nomes de usuário reservados (rotas e termos sensíveis).
const RESERVED_USERNAMES = new Set([
  'admin', 'administrador', 'configuracoes', 'config', 'conta', 'perfil', 'rede', 'api',
  'u', 'login', 'logout', 'cadastro', 'sobre', 'contato', 'ajuda', 'suporte', 'anuncie',
  'publisher', 'moderador', 'root', 'null', 'undefined', 'conectalapa', 'visitelapa',
]);

const visibilityEnum = z.enum(['publico', 'amigos', 'oculto']);

// -------------------------------------------------------------------------
// Conta: nome, username (slug) e telefone.
// -------------------------------------------------------------------------
const accountSchema = z.object({
  full_name: z.string().min(2, 'Informe seu nome.').max(120),
  username: z
    .string()
    .min(3, 'O usuário precisa ter ao menos 3 caracteres.')
    .max(30, 'O usuário pode ter no máximo 30 caracteres.')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen.'),
  phone: z.string().max(40).optional().default(''),
});

export async function saveAccount(input: z.input<typeof accountSchema>): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const username = v.username.toLowerCase();
  if (RESERVED_USERNAMES.has(username)) {
    return { ok: false, error: 'Este nome de usuário não está disponível.' };
  }

  // Unicidade do slug (username), ignorando o próprio perfil.
  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', username)
    .neq('id', profileId)
    .maybeSingle();
  if (taken) return { ok: false, error: 'Este nome de usuário já está em uso.' };

  const { error: uErr } = await supabase
    .from('profiles')
    .update({
      full_name: v.full_name.trim(),
      slug: username,
      phone: v.phone.trim() || null,
    })
    .eq('id', profileId);
  if (uErr) return { ok: false, error: 'Não foi possível salvar a conta.' };

  revalidatePath('/configuracoes/conta');
  revalidatePath(`/u/${username}`);
  return { ok: true, slug: username };
}

// Verifica disponibilidade de username (para feedback ao digitar).
export async function checkUsername(username: string): Promise<{ available: boolean; reason?: string }> {
  const clean = username.toLowerCase().trim();
  if (!/^[a-z0-9-]{3,30}$/.test(clean)) {
    return { available: false, reason: 'Formato inválido.' };
  }
  if (RESERVED_USERNAMES.has(clean)) return { available: false, reason: 'Indisponível.' };
  const { profileId, supabase } = await requireProfile();
  if (!profileId || !supabase) return { available: false, reason: 'Faça login.' };
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('slug', clean)
    .neq('id', profileId)
    .maybeSingle();
  return data ? { available: false, reason: 'Já está em uso.' } : { available: true };
}

// -------------------------------------------------------------------------
// Perfil: valores dos campos + visibilidade global + visibilidade por campo.
// Salvamento explícito (um botão persiste tudo).
// -------------------------------------------------------------------------
const fieldKeys = PROFILE_FIELDS.map((f) => f.key) as [FieldKey, ...FieldKey[]];

const profileSchema = z.object({
  full_name: z.string().min(2, 'Informe seu nome.').max(120),
  bio: z.string().max(500).optional().default(''),
  phone: z.string().max(40).optional().default(''),
  avatar_url: z.string().url().optional().or(z.literal('')).default(''),
  cover_url: z.string().url().optional().or(z.literal('')).default(''),
  nickname: z.string().max(60).optional().default(''),
  city: z.string().max(120).optional().default(''),
  birth_date: z.string().optional().default(''),
  relationship: z.string().max(60).optional().default(''),
  interests: z.string().max(2000).optional().default(''),
  about: z.string().max(4000).optional().default(''),
  visibility: visibilityEnum,
  fieldVisibility: z.record(z.enum(fieldKeys), visibilityEnum),
});

export async function saveProfileSettings(
  input: z.input<typeof profileSchema>,
): Promise<ActionResult> {
  const { profileId, slug, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  // Gera slug na primeira vez, se ainda não houver.
  let finalSlug = slug ?? '';
  if (!finalSlug) {
    finalSlug = slugify(v.nickname || v.full_name) || `usuario-${Date.now()}`;
  }

  const { error: pErr } = await supabase
    .from('profiles')
    .update({
      full_name: v.full_name.trim(),
      bio: v.bio.trim() || null,
      phone: v.phone.trim() || null,
      avatar_url: v.avatar_url || null,
      slug: finalSlug,
    })
    .eq('id', profileId);
  if (pErr) return { ok: false, error: 'Não foi possível salvar o perfil.' };

  const { error: dErr } = await supabase.from('profile_details').upsert(
    {
      profile_id: profileId,
      visibility: v.visibility,
      nickname: v.nickname.trim() || null,
      city: v.city.trim() || null,
      birth_date: v.birth_date || null,
      relationship: v.relationship.trim() || null,
      interests: v.interests.trim() || null,
      about: v.about.trim() || null,
      cover_url: v.cover_url || null,
    },
    { onConflict: 'profile_id' },
  );
  if (dErr) return { ok: false, error: 'Não foi possível salvar os detalhes do perfil.' };

  // Visibilidade por campo (upsert em lote).
  const rows = Object.entries(v.fieldVisibility)
    .filter(([key]) => isFieldKey(key))
    .map(([field_key, visibility]) => ({ profile_id: profileId, field_key, visibility }));
  if (rows.length > 0) {
    const { error: vErr } = await supabase
      .from('user_field_visibility')
      .upsert(rows, { onConflict: 'profile_id,field_key' });
    if (vErr) return { ok: false, error: 'Não foi possível salvar a privacidade dos campos.' };
  }

  revalidatePath('/configuracoes/perfil');
  revalidatePath('/configuracoes');
  revalidatePath(`/u/${finalSlug}`);
  return { ok: true, slug: finalSlug };
}

// -------------------------------------------------------------------------
// Interações: quem pode pedir amizade / mandar mensagem.
// -------------------------------------------------------------------------
const interactionSchema = z.object({
  friend_request_permission: z.enum(['todos', 'amigos_de_amigos', 'ninguem']),
  message_permission: z.enum(['amigos', 'ninguem']),
});

export async function saveInteractionSettings(
  input: z.input<typeof interactionSchema>,
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = interactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: uErr } = await supabase.from('user_privacy_settings').upsert(
    { profile_id: profileId, ...parsed.data },
    { onConflict: 'profile_id' },
  );
  if (uErr) return { ok: false, error: 'Não foi possível salvar as interações.' };

  revalidatePath('/configuracoes/interacoes');
  return { ok: true };
}

// -------------------------------------------------------------------------
// Descoberta: indexação por buscadores e visibilidade em buscas internas.
// -------------------------------------------------------------------------
const discoverySchema = z.object({
  allow_search_indexing: z.boolean(),
  search_visibility: visibilityEnum,
});

export async function saveDiscoverySettings(
  input: z.input<typeof discoverySchema>,
): Promise<ActionResult> {
  const { profileId, slug, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = discoverySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: uErr } = await supabase.from('user_privacy_settings').upsert(
    { profile_id: profileId, ...parsed.data },
    { onConflict: 'profile_id' },
  );
  if (uErr) return { ok: false, error: 'Não foi possível salvar a descoberta.' };

  revalidatePath('/configuracoes/privacidade');
  if (slug) revalidatePath(`/u/${slug}`);
  return { ok: true };
}

// -------------------------------------------------------------------------
// Conteúdo/feed: palavras silenciadas, autoplay, conteúdo sensível.
// -------------------------------------------------------------------------
const contentSchema = z.object({
  muted_words: z.array(z.string().min(1).max(40)).max(100),
  autoplay_videos: z.boolean(),
  hide_sensitive: z.boolean(),
});

export async function saveContentPrefs(
  input: z.input<typeof contentSchema>,
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  // Normaliza: minúsculas, sem duplicatas, sem vazios.
  const words = Array.from(
    new Set(parsed.data.muted_words.map((w) => w.toLowerCase().trim()).filter(Boolean)),
  );

  const { error: uErr } = await supabase.from('user_content_prefs').upsert(
    {
      profile_id: profileId,
      muted_words: words,
      autoplay_videos: parsed.data.autoplay_videos,
      hide_sensitive: parsed.data.hide_sensitive,
    },
    { onConflict: 'profile_id' },
  );
  if (uErr) return { ok: false, error: 'Não foi possível salvar as preferências de conteúdo.' };

  revalidatePath('/configuracoes/conteudo');
  revalidatePath('/feed');
  return { ok: true };
}

// -------------------------------------------------------------------------
// Mídia: visibilidade padrão de novos álbuns.
// -------------------------------------------------------------------------
const mediaSchema = z.object({ default_album_visibility: visibilityEnum });

export async function saveMediaPrefs(
  input: z.input<typeof mediaSchema>,
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = mediaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: uErr } = await supabase.from('user_content_prefs').upsert(
    { profile_id: profileId, default_album_visibility: parsed.data.default_album_visibility },
    { onConflict: 'profile_id' },
  );
  if (uErr) return { ok: false, error: 'Não foi possível salvar a privacidade de mídia.' };

  revalidatePath('/configuracoes/midia');
  return { ok: true };
}

// -------------------------------------------------------------------------
// Notificações: toggles por categoria (in-app) + master de e-mail.
// -------------------------------------------------------------------------
const notificationSchema = z.object({
  inapp_amizade: z.boolean(),
  inapp_recado: z.boolean(),
  inapp_depoimento: z.boolean(),
  inapp_mensagem: z.boolean(),
  email_enabled: z.boolean(),
});

export async function saveNotificationPrefs(
  input: z.input<typeof notificationSchema>,
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: uErr } = await supabase.from('user_notification_prefs').upsert(
    { profile_id: profileId, ...parsed.data },
    { onConflict: 'profile_id' },
  );
  if (uErr) return { ok: false, error: 'Não foi possível salvar as notificações.' };

  revalidatePath('/configuracoes/notificacoes');
  return { ok: true };
}

// Aplica um preset de privacidade a todos os campos de uma vez (com base no
// tipo de perfil). Não altera credenciais nem segurança.
export async function applyPrivacyPreset(
  preset: 'publico' | 'amigos' | 'privado',
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const map: Record<typeof preset, ProfileVisibility> = {
    publico: 'publico',
    amigos: 'amigos',
    privado: 'oculto',
  };
  const target = map[preset];

  // Respeita padrões mais seguros: telefone nunca fica mais aberto que 'amigos'.
  const rows = PROFILE_FIELDS.map((f) => {
    let visibility = target;
    if (f.key === 'phone' && target === 'publico') visibility = 'amigos';
    return { profile_id: profileId, field_key: f.key, visibility };
  });

  const { error: vErr } = await supabase
    .from('user_field_visibility')
    .upsert(rows, { onConflict: 'profile_id,field_key' });
  if (vErr) return { ok: false, error: 'Não foi possível aplicar o preset.' };

  revalidatePath('/configuracoes/perfil');
  revalidatePath('/configuracoes');
  return { ok: true };
}
