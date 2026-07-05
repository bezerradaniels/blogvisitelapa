'use server';

// Ações admin para papéis e status de usuários.
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { AccountStatus, UserRole } from '@/types/database';

interface ActionResult {
  ok: boolean;
  error?: string;
}

async function guard() {
  const user = await getCurrentUser();
  if (!user?.isAdmin || !user.profile) return null;
  const supabase = await createClient();
  return { supabase, selfProfileId: user.profile.id };
}

export async function setUserRole(profileId: string, role: UserRole): Promise<ActionResult> {
  const ctx = await guard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };

  // Impede o admin de remover o próprio acesso de administrador.
  if (profileId === ctx.selfProfileId && role !== 'admin') {
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
  const ctx = await guard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };

  // Impede o admin de desativar a própria conta.
  if (profileId === ctx.selfProfileId && status !== 'active') {
    return { ok: false, error: 'Você não pode desativar a sua própria conta.' };
  }

  const { error } = await ctx.supabase.from('profiles').update({ status }).eq('id', profileId);
  if (error) return { ok: false, error: 'Não foi possível atualizar o status.' };
  revalidatePath('/admin/usuarios');
  return { ok: true };
}
