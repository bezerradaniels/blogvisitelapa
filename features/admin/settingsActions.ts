'use server';

// Ações admin para configurações do site (tabela settings, chave/valor JSON).
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

async function guard() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return await createClient();
}

export async function updateSetting(key: string, value: Json) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  revalidatePath('/admin/configuracoes');
  revalidatePath('/');
  return { ok: true };
}
