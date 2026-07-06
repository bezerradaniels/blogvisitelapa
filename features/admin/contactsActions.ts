'use server';

// Ações admin para contatos públicos e leads de anunciantes.
import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import type { ContactStatus } from '@/types/database';

export async function setContactStatus(id: string, status: ContactStatus) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('contacts').update({ status }).eq('id', id);
  revalidatePath('/admin/contatos');
  return { ok: true };
}

export async function deleteContact(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('contacts').delete().eq('id', id);
  revalidatePath('/admin/contatos');
  return { ok: true };
}

export async function setAdvertiserStatus(id: string, status: ContactStatus) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('advertiser_contacts').update({ status }).eq('id', id);
  revalidatePath('/admin/anunciantes');
  return { ok: true };
}

export async function deleteAdvertiser(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('advertiser_contacts').delete().eq('id', id);
  revalidatePath('/admin/anunciantes');
  return { ok: true };
}
