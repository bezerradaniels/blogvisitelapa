import Link from 'next/link';
import Button from '@/components/Button';
import CommunityCard from '@/components/CommunityCard';
import EmptyState from '@/components/EmptyState';
import SectionTitle from '@/components/SectionTitle';
import { listCommunities, listUserCommunities } from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { COMMUNITY_CATEGORIES } from '@/lib/config/communities';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';
import { cn } from '@/lib/utils/cn';

export const metadata = buildMetadata({
  title: 'Comunidades',
  description: `Comunidades de moradores e visitantes de ${siteConfig.geo.city}. Participe das conversas por interesse.`,
  path: '/comunidades',
});

interface Props {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}

export default async function ComunidadesPage({ searchParams }: Props) {
  const { categoria, q } = await searchParams;
  const [communities, user] = await Promise.all([
    listCommunities({ category: categoria, q }),
    getCurrentUser(),
  ]);
  const mine = user?.profile ? await listUserCommunities(user.profile.id) : [];

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-title md:text-3xl">Comunidades</h1>
          <p className="mt-1 text-sm text-muted">
            Encontre pessoas com os mesmos interesses em {siteConfig.geo.city}.
          </p>
        </div>
        <Button href="/comunidades/nova" variant="accent" size="sm">
          Criar comunidade
        </Button>
      </div>

      {/* Busca */}
      <form action="/comunidades" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar comunidades..."
          className="h-11 w-full rounded-full border border-line bg-card px-5 text-sm outline-none focus:border-brand"
          aria-label="Buscar comunidades"
        />
      </form>

      {/* Filtro por categoria */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/comunidades"
          className={cn(
            'rounded-full px-3 py-1.5 text-sm font-bold transition-colors',
            !categoria ? 'bg-brand text-white' : 'bg-surface text-body hover:bg-brand-soft',
          )}
        >
          Todas
        </Link>
        {COMMUNITY_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/comunidades?categoria=${c.value}`}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-bold transition-colors',
              categoria === c.value ? 'bg-brand text-white' : 'bg-surface text-body hover:bg-brand-soft',
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {mine.length > 0 && (
        <section className="mb-8">
          <SectionTitle title="Minhas comunidades" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title={q ? `Resultados para “${q}”` : 'Explorar comunidades'} />
        {communities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma comunidade por aqui ainda"
            description="Que tal criar a primeira e reunir a galera?"
            action={<Button href="/comunidades/nova">Criar comunidade</Button>}
          />
        )}
      </section>
    </div>
  );
}
