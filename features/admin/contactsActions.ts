'use server';

// Ações admin para contatos públicos e leads de anunciantes.
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { ContactStatus } from '@/types/database';

async function guard() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;
  return await createClient();
}

export async function setContactStatus(id: string, status: ContactStatus) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('contacts').update({ status }).eq('id', id);
  revalidatePath('/admin/contatos');
  return { ok: true };
}

export async function deleteContact(id: string) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('contacts').delete().eq('id', id);
  revalidatePath('/admin/contatos');
  return { ok: true };
}

export async function setAdvertiserStatus(id: string, status: ContactStatus) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('advertiser_contacts').update({ status }).eq('id', id);
  revalidatePath('/admin/anunciantes');
  return { ok: true };
}

export async function deleteAdvertiser(id: string) {
  const supabase = await guard();
  if (!supabase) return { ok: false };
  await supabase.from('advertiser_contacts').delete().eq('id', id);
  revalidatePath('/admin/anunciantes');
  return { ok: true };
}
