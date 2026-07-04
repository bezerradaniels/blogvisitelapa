import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import Button from '@/components/Button';
import CategoryCarousel from '@/components/CategoryCarousel';
import EmptyState from '@/components/EmptyState';
import PostCard from '@/components/PostCard';
import SectionTitle from '@/components/SectionTitle';
import {
  listMostReadPosts,
  listPublishedPosts,
  listUpcomingEvents,
} from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/lib/utils/format';

export const metadata = buildMetadata({
  description:
    `${siteConfig.slogan}. Acompanhe notícias, eventos, turismo, religiosidade e o guia local ` +
    `de ${siteConfig.geo.city}, ${siteConfig.geo.stateCode}.`,
});

// Revalida a home periodicamente (conteúdo dinâmico, cache leve).
export const revalidate = 120;

export default async function HomePage() {
  const [featuredList, latest, events, mostRead, guides] = await Promise.all([
    listPublishedPosts({ featured: true, limit: 3 }),
    listPublishedPosts({ limit: 8 }),
    listUpcomingEvents(4),
    listMostReadPosts(5),
    listPublishedPosts({ contentType: 'guia', limit: 3 }),
  ]);

  const hero = featuredList[0] ?? latest[0];
  const secondary = (featuredList.length > 1 ? featuredList.slice(1) : latest.slice(1, 3)).slice(0, 2);

  return (
    <div className="container-page space-y-8 py-5">
      {/* 1. Hero editorial */}
      <section aria-label="Destaques">
        {hero ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PostCard post={hero} variant="featured" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {secondary.map((p) => (
                <PostCard key={p.id} post={p} variant="compact" />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Bem-vindo ao Visite Lapa"
            description="Ainda não há conteúdo publicado. Volte em breve para as novidades de Bom Jesus da Lapa."
          />
        )}
      </section>

      {/* 2. Carrossel fixo de seções */}
      <CategoryCarousel />

      {/* Banner (contrato manual) — topo da home */}
      <AdBanner placement="home_top" />

      {/* 3. Últimas notícias */}
      <section>
        <SectionTitle title="Últimas notícias" href="/noticias" />
        {latest.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.slice(0, 8).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="Sem notícias por enquanto" />
        )}
      </section>

      {/* Banner do meio */}
      <AdBanner placement="home_middle" />

      {/* 4. Eventos */}
      <section>
        <SectionTitle title="Próximos eventos" href="/eventos" />
        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((p) => (
              <PostCard key={p.id} post={p} variant="compact" />
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhum evento agendado" description="Fique de olho na nossa agenda." />
        )}
      </section>

      {/* 5. Guia da cidade + 7. Mais lidas */}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionTitle title="Guia local" href="/categorias/guia-local" />
          {guides.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {guides.map((p) => (
                <PostCard key={p.id} post={p} variant="compact" />
              ))}
            </div>
          ) : (
            <EmptyState title="Guia em construção" />
          )}
        </section>

        <aside>
          <SectionTitle title="Mais lidas" />
          <ol className="card-base divide-y divide-line">
            {mostRead.length > 0 ? (
              mostRead.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/post/${p.slug}`} className="flex gap-3 p-3 hover:bg-surface">
                    <span className="font-headline text-lg font-bold text-brand">{i + 1}</span>
                    <span>
                      <span className="line-clamp-2 text-sm font-medium text-title">{p.title}</span>
                      <time className="text-xs text-muted" dateTime={p.published_at ?? p.created_at}>
                        {formatDate(p.published_at ?? p.created_at)}
                      </time>
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-3 text-sm text-muted">Sem dados ainda.</li>
            )}
          </ol>
        </aside>
      </div>

      {/* 9. CTA anunciante */}
      <section className="card-base flex flex-col items-center gap-3 bg-brand-soft px-6 py-8 text-center">
        <h2 className="text-lg font-bold text-title md:text-xl">
          Anuncie no maior portal de Bom Jesus da Lapa
        </h2>
        <p className="max-w-xl text-sm text-muted">
          Banners, posts patrocinados, eventos patrocinados e pacotes personalizados para o seu
          negócio alcançar moradores, romeiros e visitantes.
        </p>
        <Button href="/anuncie" size="lg">
          Quero anunciar
        </Button>
      </section>
    </div>
  );
}
