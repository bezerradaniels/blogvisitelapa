import { z } from 'zod';

const safeUrl = z.string().trim().max(2048).refine(
  (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
  'Use uma URL interna ou http(s).',
);

export const homeSectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, 'Informe um título com pelo menos 2 caracteres.').max(120),
  subtitle: z.string().trim().max(180).optional().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.'),
  status: z.enum(['active', 'inactive']).default('inactive'),
  display_order: z.number().int().min(0).max(100000).default(0),
  placement_zone: z.enum(['after-hero', 'after-latest-news', 'before-events', 'before-footer']),
  selection_mode: z.enum(['manual', 'automatic']).default('manual'),
  show_view_all: z.boolean().default(true),
  view_all_mode: z.enum(['internal', 'custom', 'hidden']).default('internal'),
  custom_view_all_url: safeUrl.optional().or(z.literal('')).default(''),
  cover_image_url: safeUrl.optional().or(z.literal('')).default(''),
  cover_image_alt: z.string().trim().max(180).optional().default(''),
  post_ids: z.array(z.string().uuid()).max(100).refine((ids) => new Set(ids).size === ids.length, 'Há posts repetidos.'),
}).superRefine((value, ctx) => {
  if (value.view_all_mode === 'custom' && !value.custom_view_all_url) ctx.addIssue({ code: 'custom', path: ['custom_view_all_url'], message: 'Informe a URL personalizada.' });
  if (value.cover_image_url && !value.cover_image_alt) ctx.addIssue({ code: 'custom', path: ['cover_image_alt'], message: 'Informe o texto alternativo da imagem.' });
  if (value.status === 'active' && value.selection_mode === 'manual' && value.post_ids.length === 0) ctx.addIssue({ code: 'custom', path: ['post_ids'], message: 'Uma seção ativa precisa de ao menos um post.' });
});

export type HomeSectionInput = z.input<typeof homeSectionSchema>;
