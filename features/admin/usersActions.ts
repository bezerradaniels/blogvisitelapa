'use server';

// Ações admin para papéis e status de usuários.
import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import type { AccountStatus, UserRole } from '@/types/database';

interface ActionResult {
  ok: boolean;
  error?: string;
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
  revalidatePath('/admin/usuarios');
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
  revalidatePath('/admin/usuarios');
  return { ok: true };
}
