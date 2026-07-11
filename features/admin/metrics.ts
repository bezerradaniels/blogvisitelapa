import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface AdminMetrics {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  pending_posts: number;
  total_users: number;
  total_publishers: number;
  pending_comments: number;
  active_contracts: number;
  expiring_contracts: number;
  expired_contracts: number;
  sponsored_posts: number;
  sponsored_events: number;
  recent_contacts: number;
  recent_leads: number;
}

/**
 * Carrega as métricas com a sessão do administrador.
 *
 * As consultas continuam protegidas pelas políticas de RLS. Mantê-las aqui,
 * em vez de esconder erros de uma única RPC atrás de valores zero, também faz
 * o dashboard falhar de forma explícita caso o banco esteja fora de sincronia.
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient();
  const today = new Date();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

  const results = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'publicado'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'rascunho'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'enviado_para_revisao'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'publisher'),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('ad_contracts').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase
      .from('ad_contracts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ativo')
      .gte('end_date', dateOnly(today))
      .lte('end_date', dateOnly(inSevenDays)),
    supabase.from('ad_contracts').select('id', { count: 'exact', head: true }).eq('status', 'expirado'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_sponsored', true),
    supabase.from('sponsored_events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
    supabase.from('advertiser_contacts').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(`Não foi possível carregar as métricas do dashboard: ${failed.error.message}`);
  }

  const countAt = (index: number) => results[index]?.count ?? 0;
  return {
    total_posts: countAt(0),
    published_posts: countAt(1),
    draft_posts: countAt(2),
    pending_posts: countAt(3),
    total_users: countAt(4),
    total_publishers: countAt(5),
    pending_comments: countAt(6),
    active_contracts: countAt(7),
    expiring_contracts: countAt(8),
    expired_contracts: countAt(9),
    sponsored_posts: countAt(10),
    sponsored_events: countAt(11),
    recent_contacts: countAt(12),
    recent_leads: countAt(13),
  };
}
