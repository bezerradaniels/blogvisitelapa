'use server';

// Ações admin para papéis e status de usuários.
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { AccountStatus, UserRole } from '@/types/database';

async function guard() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return await createClient();
}

export async function setUserRole(profileId: string, role: UserRole) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('profiles').update({ role }).eq('id', profileId);
  revalidatePath('/admin/usuarios');
  return { ok: true };
}

export async function setUserStatus(profileId: string, status: AccountStatus) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('profiles').update({ status }).eq('id', profileId);
  revalidatePath('/admin/usuarios');
  return { ok: true };
}
