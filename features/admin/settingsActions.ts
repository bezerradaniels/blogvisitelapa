'use server';

// Ações admin para configurações do site (tabela settings, chave/valor JSON).
import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import type { Json } from '@/types/database';

export async function updateSetting(key: string, value: Json) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  revalidatePath('/admin/configuracoes');
  revalidatePath('/');
  return { ok: true };
}
