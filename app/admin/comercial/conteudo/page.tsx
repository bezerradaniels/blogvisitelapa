import SponsoredManager from '@/features/admin/SponsoredManager';
import { adminGuard } from '@/lib/auth/adminGuard';
import type { PostWithRelations } from '@/types/posts';

export const dynamic = 'force-dynamic';

interface SponsoredRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  post: { title: string; slug: string } | null;
}

export default async function ComercialConteudoPage() {
  const ctx = await adminGuard();
  if (!ctx) return null;

  const [articlePostsResult, eventPostsResult, articlesResult, eventsResult, itemsResult] = await Promise.all([
    ctx.supabase
      .from('posts')
      .select('id, title, slug')
      .order('created_at', { ascending: false })
      .limit(200),
    ctx.supabase
      .from('posts')
      .select('id, title, slug')
      .eq('is_event', true)
      .order('created_at', { ascending: false })
      .limit(200),
    ctx.supabase
      .from('sponsored_articles')
      .select('id, label, is_active, created_at, post:posts(title, slug)')
      .order('created_at', { ascending: false }),
    ctx.supabase
      .from('sponsored_events')
      .select('id, label, is_active, created_at, post:posts(title, slug)')
      .order('created_at', { ascending: false }),
    ctx.supabase
      .from('contract_items')
      .select('id, contract_id, custom_name, requires_content_creation')
      .eq('requires_content_creation', true)
      .order('created_at', { ascending: false }),
  ]);

  const contractIds = [...new Set((itemsResult.data ?? []).map((item) => item.contract_id))];
  const contractsResult = contractIds.length
    ? await ctx.supabase.from('ad_contracts').select('id, contract_number, title, status').in('id', contractIds)
    : { data: [], error: null };

  if (
    articlePostsResult.error ||
    eventPostsResult.error ||
    articlesResult.error ||
    eventsResult.error ||
    itemsResult.error ||
    contractsResult.error
  ) {
    throw new Error('Não foi possível carregar o conteúdo patrocinado.');
  }
  const contractMap = new Map((contractsResult.data ?? []).map((contract) => [contract.id, contract]));
  const contractItems = (itemsResult.data ?? [])
    .filter((item) => {
      const contract = contractMap.get(item.contract_id);
      return contract && !['cancelado', 'removido'].includes(contract.status);
    })
    .map((item) => {
      const contract = contractMap.get(item.contract_id)!;
      return {
        id: item.id,
        contract_id: item.contract_id,
        label: `${contract.contract_number ?? contract.title} — ${item.custom_name}`,
      };
    });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-2xl font-extrabold text-title">Conteúdo patrocinado</h1>
        <p className="mt-1 text-sm text-muted">
          Gerencie publieditoriais e eventos patrocinados na mesma área.
        </p>
      </header>

      <section aria-labelledby="sponsored-articles-heading" className="space-y-3">
        <div>
          <h2 id="sponsored-articles-heading" className="text-lg font-bold text-title">Publieditoriais</h2>
          <p className="text-sm text-muted">Posts identificados como conteúdo patrocinado.</p>
        </div>
        <SponsoredManager
          kind="article"
          posts={(articlePostsResult.data ?? []) as Pick<PostWithRelations, 'id' | 'title' | 'slug'>[]}
          entries={(articlesResult.data ?? []) as unknown as SponsoredRow[]}
          contractItems={contractItems}
        />
      </section>

      <section aria-labelledby="sponsored-events-heading" className="space-y-3 border-t border-line pt-8">
        <div>
          <h2 id="sponsored-events-heading" className="text-lg font-bold text-title">Eventos patrocinados</h2>
          <p className="text-sm text-muted">Eventos publicados com identificação comercial.</p>
        </div>
        <SponsoredManager
          kind="event"
          posts={(eventPostsResult.data ?? []) as Pick<PostWithRelations, 'id' | 'title' | 'slug'>[]}
          entries={(eventsResult.data ?? []) as unknown as SponsoredRow[]}
          contractItems={contractItems}
        />
      </section>
    </div>
  );
}
