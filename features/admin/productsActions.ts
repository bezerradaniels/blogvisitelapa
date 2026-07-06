'use server';

// Ações admin para produtos comerciais avulsos.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';

const productSchema = z.object({
  id: z.string().uuid().optional(),
  product_name: z.string().min(2, 'Informe o nome do produto.'),
  description: z.string().optional().default(''),
  price: z.string().optional().default(''),
  company_name: z.string().optional().default(''),
  payment_method: z.string().optional().default(''),
  payment_status: z.enum(['pendente', 'parcial', 'pago', 'atrasado', 'cancelado']).optional().default('pendente'),
  delivery_status: z.enum(['pendente', 'em_producao', 'entregue', 'cancelado']).optional().default('pendente'),
  notes: z.string().optional().default(''),
});

export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const { supabase } = ctx;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const payload = {
    product_name: d.product_name.trim(),
    description: d.description.trim() || null,
    price: d.price ? Number(d.price) : null,
    company_name: d.company_name.trim() || null,
    payment_method: d.payment_method.trim() || null,
    payment_status: d.payment_status,
    delivery_status: d.delivery_status,
    notes: d.notes.trim() || null,
  };

  const { error } = d.id
    ? await supabase.from('standalone_products').update(payload).eq('id', d.id)
    : await supabase.from('standalone_products').insert(payload);
  if (error) return { ok: false, error: 'Não foi possível salvar o produto.' };

  revalidatePath('/admin/produtos-avulsos');
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('standalone_products').delete().eq('id', id);
  revalidatePath('/admin/produtos-avulsos');
  return { ok: true };
}
