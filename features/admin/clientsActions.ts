'use server';

// Ações admin para clientes comerciais e histórico (CRM).
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  client_name: z.string().trim().min(2, 'Informe o nome do cliente.'),
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

  const normalizedEmail = d.email.trim().toLowerCase();
  const normalizedDocument = d.document.replace(/\D/g, '');
  const payload = {
    client_name: d.client_name,
    company_name: d.company_name.trim() || null,
    segment: d.segment.trim() || null,
    email: normalizedEmail || null,
    whatsapp: d.whatsapp.trim() || null,
    document: normalizedDocument || null,
    notes: d.notes.trim() || null,
    status: d.status,
  };

  const { error } = d.id
    ? await ctx.supabase.from('commercial_clients').update(payload).eq('id', d.id)
    : await ctx.supabase.from('commercial_clients').insert(payload);
  if (error) {
    const duplicate = error.code === '23505';
    return {
      ok: false,
      error: duplicate
        ? 'Já existe um cliente com este documento ou e-mail.'
        : 'Não foi possível salvar o cliente.',
    };
  }

  revalidatePath('/admin/clientes-comerciais');
  revalidatePath('/admin/comercial/clientes');
  return { ok: true };
}

export async function deleteClient(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Cliente inválido.' };

  const { count, error: countError } = await ctx.supabase
    .from('ad_contracts')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id);
  if (countError) return { ok: false, error: 'Não foi possível verificar os contratos do cliente.' };

  // Um cliente é um registro comercial e histórico; ele nunca é removido
  // permanentemente pela interface. Com ou sem contratos, a ação o arquiva.
  const { error } = await ctx.supabase
    .from('commercial_clients')
    .update({ status: 'inativo', is_active: false, archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: 'Não foi possível arquivar o cliente.' };

  await ctx.supabase.from('client_history').insert({
    client_id: id,
    entry_type: 'arquivamento',
    title: 'Cliente arquivado',
    content: count ? `Arquivado com ${count} contrato(s) preservado(s).` : 'Arquivado sem contratos vinculados.',
    created_by: ctx.profileId,
  });

  revalidatePath('/admin/clientes-comerciais');
  revalidatePath('/admin/comercial/clientes');
  return { ok: true, archived: true };
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
  revalidatePath(`/admin/comercial/clientes/${clientId}`);
  return { ok: true };
}
