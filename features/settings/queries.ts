import 'server-only';

// Consultas das Configurações (sempre no servidor; RLS garante o acesso próprio).
import { PROFILE_FIELDS, type FieldKey } from '@/lib/privacy/fields';
import { resolveStoredVisibility } from '@/lib/privacy/resolve';
import { createClient } from '@/lib/supabase/server';
import type { InteractionAudience, ProfileVisibility, Tables } from '@/types/database';

export type PrivacyPrefs = Tables<'user_privacy_settings'>;

// Preferências globais (user_privacy_settings). Retorna padrões seguros se
// ainda não houver linha (todo perfil recebe uma no backfill de 0022).
export async function getPrivacyPrefs(profileId: string): Promise<PrivacyPrefs> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_privacy_settings')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (data) return data;
  return {
    profile_id: profileId,
    search_visibility: 'publico',
    allow_search_indexing: true,
    friend_list_visibility: 'amigos',
    community_list_visibility: 'publico',
    activity_visibility: 'amigos',
    online_status_visibility: 'amigos',
    friend_request_permission: 'todos' as InteractionAudience,
    message_permission: 'amigos' as InteractionAudience,
    created_at: '',
    updated_at: '',
  };
}

export type NotificationPrefs = Tables<'user_notification_prefs'>;

// Preferências de notificação (padrões ligados se não houver linha).
export async function getNotificationPrefs(profileId: string): Promise<NotificationPrefs> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_notification_prefs')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (data) return data;
  return {
    profile_id: profileId,
    inapp_amizade: true,
    inapp_recado: true,
    inapp_depoimento: true,
    inapp_mensagem: true,
    email_enabled: true,
    created_at: '',
    updated_at: '',
  };
}

// Prévia "Ver como": detalhes filtrados como uma audiência os veria (dono/admin).
export interface AudiencePreview {
  nickname: string | null;
  city: string | null;
  birth_date: string | null;
  relationship: string | null;
  interests: string | null;
  about: string | null;
  cover_url: string | null;
}

export async function getProfilePreviewAs(
  profileId: string,
  audience: 'publico' | 'amigos',
): Promise<AudiencePreview> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('visible_profile_details_as', {
    p_target: profileId,
    p_audience: audience,
  });
  const j = (data ?? {}) as Partial<AudiencePreview>;
  return {
    nickname: j.nickname ?? null,
    city: j.city ?? null,
    birth_date: j.birth_date ?? null,
    relationship: j.relationship ?? null,
    interests: j.interests ?? null,
    about: j.about ?? null,
    cover_url: j.cover_url ?? null,
  };
}

export interface ProfileSettingsData {
  full_name: string;
  bio: string;
  phone: string;
  avatar_url: string | null;
  cover_url: string | null;
  nickname: string;
  city: string;
  birth_date: string;
  relationship: string;
  interests: string;
  about: string;
  visibility: ProfileVisibility;
  fieldVisibility: Record<FieldKey, ProfileVisibility>;
}

// Monta os valores + a visibilidade por campo (usando o padrão quando ausente).
export async function getProfileSettings(
  profileId: string,
  profile: { full_name: string | null; bio: string | null; phone: string | null; avatar_url: string | null },
): Promise<ProfileSettingsData> {
  const supabase = await createClient();
  const [{ data: details }, { data: fv }] = await Promise.all([
    supabase.from('profile_details').select('*').eq('profile_id', profileId).maybeSingle(),
    supabase.from('user_field_visibility').select('field_key, visibility').eq('profile_id', profileId),
  ]);

  const stored = new Map<string, ProfileVisibility>(
    (fv ?? []).map((r) => [r.field_key, r.visibility]),
  );
  const fieldVisibility = Object.fromEntries(
    PROFILE_FIELDS.map((f) => [f.key, resolveStoredVisibility(f.key, stored.get(f.key))]),
  ) as Record<FieldKey, ProfileVisibility>;

  return {
    full_name: profile.full_name ?? '',
    bio: profile.bio ?? '',
    phone: profile.phone ?? '',
    avatar_url: profile.avatar_url,
    cover_url: details?.cover_url ?? null,
    nickname: details?.nickname ?? '',
    city: details?.city ?? '',
    birth_date: details?.birth_date ?? '',
    relationship: details?.relationship ?? '',
    interests: details?.interests ?? '',
    about: details?.about ?? '',
    visibility: details?.visibility ?? 'publico',
    fieldVisibility,
  };
}

export interface PrivacyOverview {
  publicCount: number;
  friendsCount: number;
  privateCount: number;
  total: number;
  globalVisibility: ProfileVisibility;
}

// Resumo de privacidade: quantos campos são públicos / de amigos / privados,
// considerando a visibilidade EFETIVA (o perfil global limita cada campo).
export async function getPrivacyOverview(profileId: string): Promise<PrivacyOverview> {
  const supabase = await createClient();
  const [{ data: details }, { data: fv }] = await Promise.all([
    supabase.from('profile_details').select('visibility').eq('profile_id', profileId).maybeSingle(),
    supabase.from('user_field_visibility').select('field_key, visibility').eq('profile_id', profileId),
  ]);

  const globalVisibility: ProfileVisibility = details?.visibility ?? 'publico';
  const stored = new Map<string, ProfileVisibility>(
    (fv ?? []).map((r) => [r.field_key, r.visibility]),
  );

  const order: Record<ProfileVisibility, number> = { publico: 0, amigos: 1, oculto: 2 };
  let publicCount = 0;
  let friendsCount = 0;
  let privateCount = 0;
  for (const f of PROFILE_FIELDS) {
    const field = resolveStoredVisibility(f.key, stored.get(f.key));
    // efetiva = mais restritiva entre campo e global
    const eff = order[field] >= order[globalVisibility] ? field : globalVisibility;
    if (eff === 'publico') publicCount++;
    else if (eff === 'amigos') friendsCount++;
    else privateCount++;
  }

  return {
    publicCount,
    friendsCount,
    privateCount,
    total: PROFILE_FIELDS.length,
    globalVisibility,
  };
}
