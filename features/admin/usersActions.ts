'use server';

// Ações admin para papéis e status de usuários.
import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AccountStatus, UserRole } from '@/types/database';
import { z } from 'zod';

interface ActionResult {
  ok: boolean;
  error?: string;
}

const profileIdSchema = z.string().uuid();

function revalidateUsers(profileId: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/usuarios');
  revalidatePath(`/admin/usuarios/${profileId}`);
}

async function logUserAudit(
  ctx: NonNullable<Awaited<ReturnType<typeof adminGuard>>>,
  action: string,
  profileId: string,
  metadata?: Record<string, string | boolean | null>,
) {
  await ctx.supabase.from('audit_logs').insert({
    actor_id: ctx.profileId,
    action,
    entity: 'profiles',
    entity_id: profileId,
    metadata: metadata ?? null,
  });
}

export async function setUserRole(profileId: string, role: UserRole): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const selfProfileId = ctx.profileId;

  // Impede o admin de remover o próprio acesso de administrador.
  if (profileId === selfProfileId && role !== 'admin') {
    return { ok: false, error: 'Você não pode remover o seu próprio acesso de administrador.' };
  }

  const { error } = await ctx.supabase.from('profiles').update({ role }).eq('id', profileId);
  if (error) return { ok: false, error: 'Não foi possível atualizar o papel.' };
  await logUserAudit(ctx, 'user.role_updated', profileId, { role });
  revalidateUsers(profileId);
  return { ok: true };
}

export async function setUserStatus(
  profileId: string,
  status: AccountStatus,
): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const selfProfileId = ctx.profileId;

  // Impede o admin de desativar a própria conta.
  if (profileId === selfProfileId && status !== 'active') {
    return { ok: false, error: 'Você não pode desativar a sua própria conta.' };
  }

  const { error } = await ctx.supabase.from('profiles').update({ status }).eq('id', profileId);
  if (error) return { ok: false, error: 'Não foi possível atualizar o status.' };
  await logUserAudit(ctx, 'user.status_updated', profileId, { status });
  revalidateUsers(profileId);
  return { ok: true };
}

export async function setUserSuspended(
  profileId: string,
  suspended: boolean,
): Promise<ActionResult> {
  const parsedId = profileIdSchema.safeParse(profileId);
  if (!parsedId.success) return { ok: false, error: 'Usuário inválido.' };

  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (profileId === ctx.profileId) {
    return { ok: false, error: 'Você não pode suspender a sua própria conta.' };
  }

  const { data: profile, error: profileError } = await ctx.supabase
    .from('profiles')
    .select('user_id, status')
    .eq('id', profileId)
    .maybeSingle();
  if (profileError || !profile) return { ok: false, error: 'Usuário não encontrado.' };

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(profile.user_id, {
    ban_duration: suspended ? '876000h' : 'none',
  });
  if (authError) return { ok: false, error: 'Não foi possível alterar o bloqueio da conta.' };

  const nextStatus: AccountStatus = suspended ? 'suspended' : 'active';
  const { error: updateError } = await ctx.supabase
    .from('profiles')
    .update({ status: nextStatus })
    .eq('id', profileId);

  if (updateError) {
    await adminClient.auth.admin.updateUserById(profile.user_id, {
      ban_duration: suspended ? 'none' : '876000h',
    });
    return { ok: false, error: 'Não foi possível atualizar o status do perfil.' };
  }

  await logUserAudit(ctx, suspended ? 'user.suspended' : 'user.reactivated', profileId);
  revalidateUsers(profileId);
  return { ok: true };
}

export async function setUserAttention(
  profileId: string,
  flagged: boolean,
  note: string,
): Promise<ActionResult> {
  const parsed = z
    .object({ profileId: profileIdSchema, flagged: z.boolean(), note: z.string().trim().max(2000) })
    .safeParse({ profileId, flagged, note });
  if (!parsed.success) return { ok: false, error: 'A nota deve ter no máximo 2.000 caracteres.' };

  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };

  const { error } = await ctx.supabase.from('audit_logs').insert({
    actor_id: ctx.profileId,
    action: flagged ? 'user.attention_flagged' : 'user.attention_cleared',
    entity: 'profiles',
    entity_id: profileId,
    metadata: flagged ? { note: parsed.data.note || null } : null,
  });
  if (error) return { ok: false, error: 'Não foi possível atualizar a sinalização interna.' };
  revalidateUsers(profileId);
  return { ok: true };
}

export async function deleteUserPermanently(profileId: string): Promise<ActionResult> {
  const parsedId = profileIdSchema.safeParse(profileId);
  if (!parsedId.success) return { ok: false, error: 'Usuário inválido.' };

  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (profileId === ctx.profileId) {
    return { ok: false, error: 'Você não pode excluir definitivamente a sua própria conta.' };
  }

  const { data: profile, error: profileError } = await ctx.supabase
    .from('profiles')
    .select('user_id, full_name')
    .eq('id', profileId)
    .maybeSingle();
  if (profileError || !profile) return { ok: false, error: 'Usuário não encontrado.' };

  const adminClient = createAdminClient();
  for (const bucket of ['user-avatars', 'user-photos'] as const) {
    const { data: objects, error: listError } = await adminClient.storage
      .from(bucket)
      .list(profile.user_id, { limit: 1000 });
    if (listError) {
      return { ok: false, error: `Não foi possível verificar os arquivos da conta: ${listError.message}` };
    }
    const paths = (objects ?? [])
      .filter((object) => object.id)
      .map((object) => `${profile.user_id}/${object.name}`);
    if (paths.length > 0) {
      const { error: storageError } = await adminClient.storage.from(bucket).remove(paths);
      if (storageError) {
        return { ok: false, error: `Não foi possível remover os arquivos da conta: ${storageError.message}` };
      }
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(profile.user_id, false);
  if (deleteError) {
    return {
      ok: false,
      error: `Não foi possível excluir definitivamente a conta: ${deleteError.message}`,
    };
  }

  await logUserAudit(ctx, 'user.deleted_permanently', profileId, {
    full_name: profile.full_name,
    auth_user_id: profile.user_id,
  });
  revalidateUsers(profileId);
  return { ok: true };
}
