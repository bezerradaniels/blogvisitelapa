'use server';

// Ciclo de vida da conta: exportar dados, desativar, reativar, solicitar/cancelar
// exclusão. Mudanças de status usam o client autenticado (RLS + guard 0028
// permitem o autoatendimento do dono). A trilha de auditoria é gravada com o
// client de service role (o usuário não forja registros).
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export interface ActionResult {
  ok: boolean;
  error?: string | null;
}

async function requireProfile() {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return { profileId: null, status: null, supabase: null, error: 'É preciso estar logado.' };
  }
  const supabase = await createClient();
  return { profileId: user.profile.id, status: user.profile.status, supabase, error: null };
}

// Registra um evento de segurança (service role — não passa pela RLS).
async function logAudit(profileId: string, action: string, metadata?: Json) {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: profileId,
      action,
      entity: 'profiles',
      entity_id: profileId,
      metadata: metadata ?? null,
    });
  } catch {
    // Auditoria não deve bloquear a ação principal.
  }
}

// ---------------------------------------------------------------------
// Exportar meus dados (JSON). RLS já limita ao próprio usuário; ainda assim
// filtramos explicitamente por profileId.
// ---------------------------------------------------------------------
export async function exportMyData(): Promise<{ ok: boolean; error?: string; json?: string }> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error: error ?? 'Sessão inválida.' };

  const me = profileId;
  const [
    profile, details, privacy, fieldVis, notif, content,
    friendships, memberships, posts, scraps, testimonials, albums, photos, blocks,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', me).maybeSingle(),
    supabase.from('profile_details').select('*').eq('profile_id', me).maybeSingle(),
    supabase.from('user_privacy_settings').select('*').eq('profile_id', me).maybeSingle(),
    supabase.from('user_field_visibility').select('field_key, visibility').eq('profile_id', me),
    supabase.from('user_notification_prefs').select('*').eq('profile_id', me).maybeSingle(),
    supabase.from('user_content_prefs').select('*').eq('profile_id', me).maybeSingle(),
    supabase.from('friendships').select('*').or(`requester_id.eq.${me},addressee_id.eq.${me}`),
    supabase.from('community_members').select('*').eq('user_id', me),
    supabase.from('social_posts').select('*').eq('author_id', me),
    supabase.from('scraps').select('*').eq('author_id', me),
    supabase.from('testimonials').select('*').or(`author_id.eq.${me},profile_id.eq.${me}`),
    supabase.from('photo_albums').select('*').eq('profile_id', me),
    supabase.from('photos').select('*').eq('profile_id', me),
    supabase.from('blocks').select('*').eq('blocker_id', me),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data ?? null,
    profile_details: details.data ?? null,
    privacy_settings: privacy.data ?? null,
    field_visibility: fieldVis.data ?? [],
    notification_prefs: notif.data ?? null,
    content_prefs: content.data ?? null,
    friendships: friendships.data ?? [],
    community_memberships: memberships.data ?? [],
    posts: posts.data ?? [],
    scraps_authored: scraps.data ?? [],
    testimonials: testimonials.data ?? [],
    photo_albums: albums.data ?? [],
    photos: photos.data ?? [],
    blocked_users: blocks.data ?? [],
  };

  await logAudit(me, 'account.data_exported');
  return { ok: true, json: JSON.stringify(payload, null, 2) };
}

// ---------------------------------------------------------------------
// Desativar (reversível) / Reativar
// ---------------------------------------------------------------------
export async function deactivateAccount(): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const { error: uErr } = await supabase
    .from('profiles')
    .update({ status: 'deactivated', deactivated_at: new Date().toISOString() })
    .eq('id', profileId);
  if (uErr) return { ok: false, error: 'Não foi possível desativar a conta.' };

  await logAudit(profileId, 'account.deactivated');
  return { ok: true };
}

export async function reactivateAccount(): Promise<ActionResult> {
  const { profileId, status, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };
  if (status !== 'deactivated') return { ok: false, error: 'A conta não está desativada.' };

  const { error: uErr } = await supabase
    .from('profiles')
    .update({ status: 'active', deactivated_at: null })
    .eq('id', profileId);
  if (uErr) return { ok: false, error: 'Não foi possível reativar a conta.' };

  await logAudit(profileId, 'account.reactivated');
  return { ok: true };
}

// ---------------------------------------------------------------------
// Solicitar exclusão (carência de 30 dias) / Cancelar
// ---------------------------------------------------------------------
export async function requestAccountDeletion(reason?: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const clean = (reason ?? '').trim().slice(0, 500) || null;
  const { error: uErr } = await supabase
    .from('profiles')
    .update({
      status: 'pending_deletion',
      deletion_requested_at: new Date().toISOString(),
      deletion_reason: clean,
    })
    .eq('id', profileId);
  if (uErr) return { ok: false, error: 'Não foi possível solicitar a exclusão.' };

  await logAudit(profileId, 'account.deletion_requested', { reason: clean });
  return { ok: true };
}

export async function cancelAccountDeletion(): Promise<ActionResult> {
  const { profileId, status, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };
  if (status !== 'pending_deletion') return { ok: false, error: 'Não há exclusão pendente.' };

  const { error: uErr } = await supabase
    .from('profiles')
    .update({ status: 'active', deletion_requested_at: null, deletion_reason: null })
    .eq('id', profileId);
  if (uErr) return { ok: false, error: 'Não foi possível cancelar a exclusão.' };

  await logAudit(profileId, 'account.deletion_canceled');
  return { ok: true };
}
