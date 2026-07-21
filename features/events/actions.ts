'use server';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

const whatsapp = z.string().transform((value) => value.replace(/\D/g, '')).refine(
  (value) => /^\d{11}$/.test(value),
  'Informe um WhatsApp com DDD e 9 dígitos.',
);

const eventSubmissionSchema = z.object({
  title: z.string().trim().min(3, 'Informe o nome do evento.').max(160),
  description: z.string().trim().min(10, 'Descreva o evento com pelo menos 10 caracteres.').max(5000),
  eventStartDate: z.string().datetime({ offset: true }),
  eventEndDate: z.string().datetime({ offset: true }).optional().or(z.literal('')).transform((value) => value || null),
  eventLocation: z.string().trim().min(2, 'Informe onde o evento acontecerá.').max(160),
  eventAddress: optionalText(300),
  eventTicketPrice: optionalText(80),
  eventOrganizer: z.string().trim().min(2, 'Informe o responsável pelo evento.').max(160),
  eventIsFree: z.boolean(),
  contactName: optionalText(160),
  contactEmail: z.string().trim().email('Informe um e-mail válido.').optional().or(z.literal('')).transform((value) => value || null),
  contactWhatsapp: whatsapp,
  acceptsPolicy: z.boolean().refine((value) => value, 'Confirme que os dados do evento estão corretos.'),
});

export type EventSubmissionInput = z.input<typeof eventSubmissionSchema>;

export interface EventSubmissionResult {
  ok: boolean;
  error?: string;
}

export async function submitEvent(input: EventSubmissionInput): Promise<EventSubmissionResult> {
  const parsed = eventSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const data = parsed.data;
  if (data.eventEndDate && new Date(data.eventEndDate) < new Date(data.eventStartDate)) {
    return { ok: false, error: 'O término não pode ser anterior ao início do evento.' };
  }

  const user = await getCurrentUser();
  const profile = user?.profile;
  const submitterName = profile?.full_name?.trim() || data.contactName;
  const submitterEmail = user?.email || data.contactEmail;

  if (!profile && (!submitterName || !submitterEmail)) {
    return { ok: false, error: 'Informe seu nome e e-mail para acompanharmos o envio.' };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('event_submissions').insert({
      submitter_profile_id: profile?.id ?? null,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      submitter_whatsapp: data.contactWhatsapp,
      title: data.title,
      description: data.description,
      event_start_date: data.eventStartDate,
      event_end_date: data.eventEndDate,
      event_location: data.eventLocation,
      event_address: data.eventAddress,
      event_ticket_price: data.eventIsFree ? null : data.eventTicketPrice,
      event_organizer: data.eventOrganizer,
      event_is_free: data.eventIsFree,
    });

    if (error) return { ok: false, error: 'Não foi possível enviar o evento. Tente novamente.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'O envio de eventos está indisponível no momento. Tente novamente.' };
  }
}
