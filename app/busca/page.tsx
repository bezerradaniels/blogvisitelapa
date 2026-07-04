import ListingView from '@/features/posts/ListingView';
import { searchPosts } from '@/features/posts/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Busca', path: '/busca', noindex: true });

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = (q ?? '').trim();
  const posts = term ? await searchPosts(term) : [];

  return (
    <div className="container-page py-6">
      <form action="/busca" className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={term}
          placeholder="Buscar em Bom Jesus da Lapa..."
          className="h-11 w-full rounded border border-line bg-card px-4 text-sm outline-none focus:border-brand"
          aria-label="Buscar"
        />
      </form>

      {term ? (
        <ListingView
          title={`Resultados para “${term}”`}
          posts={posts}
          emptyTitle="Nenhum resultado encontrado"
        />
      ) : (
        <p className="text-sm text-muted">Digite um termo para buscar notícias, eventos e guias.</p>
      )}
    </div>
  );
}
