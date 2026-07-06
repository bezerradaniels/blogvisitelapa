'use server';

// Ações admin para categorias e tags.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';
import { slugify } from '@/lib/utils/format';

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Informe o nome.'),
  slug: z.string().optional().default(''),
  description: z.string().optional().default(''),
  type: z.enum(['editorial', 'guia', 'institucional']),
  is_fixed_carousel_item: z.boolean().optional().default(false),
  icon_name: z.string().optional().default(''),
  sort_order: z.number().optional().default(0),
  status: z.enum(['active', 'suspended', 'pending']).optional().default('active'),
});

export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(input: CategoryInput) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const { supabase } = ctx;

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const payload = {
    name: d.name.trim(),
    slug: slugify(d.slug || d.name),
    description: d.description.trim() || null,
    type: d.type,
    is_fixed_carousel_item: d.is_fixed_carousel_item,
    icon_name: d.icon_name.trim() || null,
    sort_order: d.sort_order,
    status: d.status,
  };

  const { error } = d.id
    ? await supabase.from('categories').update(payload).eq('id', d.id)
    : await supabase.from('categories').insert(payload);

  if (error) return { ok: false, error: 'Não foi possível salvar (slug já existe?).' };
  revalidatePath('/admin/categorias');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('categories').delete().eq('id', id);
  revalidatePath('/admin/categorias');
  return { ok: true };
}

export async function saveTag(input: { id?: string; name: string }) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const { supabase } = ctx;
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: 'Informe o nome da tag.' };
  const slug = slugify(name);

  const { error } = input.id
    ? await supabase.from('tags').update({ name, slug }).eq('id', input.id)
    : await supabase.from('tags').insert({ name, slug });
  if (error) return { ok: false, error: 'Não foi possível salvar a tag.' };
  revalidatePath('/admin/tags');
  return { ok: true };
}

export async function deleteTag(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false };
  const { supabase } = ctx;
  await supabase.from('tags').delete().eq('id', id);
  revalidatePath('/admin/tags');
  return { ok: true };
}
