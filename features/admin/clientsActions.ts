'use server';

// Ações admin para clientes comerciais e histórico (CRM).
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  client_name: z.string().min(2, 'Informe o nome do cliente.'),
  company_name: z.string().optional().default(''),
  segment: z.string().optional().default(''),
  email: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  document: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['ativo', 'inativo', 'prospecto']).optional().default('prospecto'),
});

export type ClientInput = z.input<typeof clientSchema>;

export async function saveClient(input: ClientInput) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const payload = {
    client_name: d.client_name.trim(),
    company_name: d.company_name.trim() || null,
    segment: d.segment.trim() || null,
    email: d.email.trim() || null,
    whatsapp: d.whatsapp.trim() || null,
    document: d.document.trim() || null,
    notes: d.notes.trim() || null,
    status: d.status,
  };

  const { error } = d.id
    ? await ctx.supabase.from('commercial_clients').update(payload).eq('id', d.id)
    : await ctx.supabase.from('commercial_clients').insert(payload);
  if (error) return { ok: false, error: 'Não foi possível salvar o cliente.' };

  revalidatePath('/admin/clientes-comerciais');
  return { ok: true };
}

export async function deleteClient(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  await ctx.supabase.from('commercial_clients').delete().eq('id', id);
  revalidatePath('/admin/clientes-comerciais');
  return { ok: true };
}

export async function addClientHistory(
  clientId: string,
  input: { entry_type: string; title: string; content: string },
) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  await ctx.supabase.from('client_history').insert({
    client_id: clientId,
    entry_type: input.entry_type || 'nota',
    title: input.title || null,
    content: input.content || null,
    created_by: ctx.profileId,
  });
  revalidatePath(`/admin/clientes-comerciais/${clientId}`);
  return { ok: true };
}
