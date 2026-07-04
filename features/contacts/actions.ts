'use server';

// Server Actions dos formulários de contato (RLS permite insert anônimo).
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const contactSchema = z.object({
  name: z.string().min(2, 'Informe seu nome.'),
  email: z.string().email('E-mail inválido.'),
  whatsapp: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, 'Escreva sua mensagem.'),
});

const advertiserSchema = z.object({
  name: z.string().min(2, 'Informe seu nome.'),
  company_name: z.string().optional(),
  segment: z.string().optional(),
  email: z.string().email('E-mail inválido.'),
  whatsapp: z.string().optional(),
  ad_type: z.string().optional(),
  budget_range: z.string().optional(),
  message: z.string().optional(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function submitContact(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('contacts').insert(parsed.data);
  if (error) return { ok: false, error: 'Não foi possível enviar. Tente novamente.' };
  return { ok: true };
}

export async function submitAdvertiserContact(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = advertiserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('advertiser_contacts').insert(parsed.data);
  if (error) return { ok: false, error: 'Não foi possível enviar. Tente novamente.' };
  return { ok: true };
}
