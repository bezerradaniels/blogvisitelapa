import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import Button from '@/components/Button';
import CategoryCarousel from '@/components/CategoryCarousel';
import EmptyState from '@/components/EmptyState';
import PostCard from '@/components/PostCard';
import SectionTitle from '@/components/SectionTitle';
import HomeSectionCarousel from '@/components/HomeSectionCarousel';
import { listPublicHomeSections } from '@/features/homeSections/queries';
import {
  listMostReadPosts,
  listPublishedPosts,
  listUpcomingEvents,
} from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  description:
    `${siteConfig.slogan}. Acompanhe notícias, eventos, turismo, religiosidade e o guia local ` +
    `de ${siteConfig.geo.city}, ${siteConfig.geo.stateCode}.`,
});

export const revalidate = 120;

// Caixinha de data (dia/mês) para os eventos.
function EventDateBox({ date }: { date: string }) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return (
    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[14px] bg-brand-soft text-brand-dark">
      <span className="font-headline text-lg font-extrabold leading-none">{day}</span>
      <span className="text-[10px] font-bold uppercase">{month}</span>
    </span>
  );
}

export default async function HomePage() {
  const [featuredList, latest, events, mostRead, guides, afterHero, afterLatest, beforeEvents, beforeFooter] = await Promise.all([
    listPublishedPosts({ featured: true, limit: 3 }),
    listPublishedPosts({ limit: 8 }),
    listUpcomingEvents(4),
    listMostReadPosts(5),
    listPublishedPosts({ contentType: 'guia', limit: 3 }),
    listPublicHomeSections('after-hero'),
    listPublicHomeSections('after-latest-news'),
    listPublicHomeSections('before-events'),
    listPublicHomeSections('before-footer'),
  ]);

  const hero = featuredList[0] ?? latest[0];
  const secondary = (featuredList.length > 1 ? featuredList.slice(1) : latest.slice(1, 3)).slice(0, 2);

  return (
    <div className="bg-card">
      {/* 1. Hero editorial — faixa neutra */}
      <section aria-label="Destaques" className="bg-section">
        <div className="container-page py-8">
          {hero ? (
            <div className="grid justify-start gap-4 md:grid-cols-[minmax(0,600px)_minmax(0,500px)]">
              <div className="w-full max-w-[600px]">
                <PostCard post={hero} variant="featured" />
              </div>
              <div className="grid w-full max-w-[500px] gap-4 md:grid-cols-1">
                {secondary.map((p) => (
                  <PostCard key={p.id} post={p} variant="compact" />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Bem-vindo ao Conecta Lapa"
              description="Ainda não há conteúdo publicado. Volte em breve para as novidades de Bom Jesus da Lapa."
            />
          )}
        </div>
      </section>

      <div className="container-page space-y-10 pt-8">
        {afterHero.map((section) => <DynamicSection key={section.id} section={section} />)}
        {/* 2. Chips de categoria */}
        <CategoryCarousel />

        {/* Banner (contrato manual) — topo da home */}
        <AdBanner placement="home_top" />

        {/* 3. Últimas notícias */}
        <section>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionTitle title="Últimas notícias" href="/noticias" linkLabel="ver todas" />
              {latest.length > 0 ? (
                <div className="grid justify-start gap-[18px] sm:grid-cols-2">
                  {latest.slice(0, 8).map((p) => (
                    <div key={p.id} className="w-[250px]">
                      <PostCard post={p} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sem notícias por enquanto" />
              )}
            </div>

            <aside>
              <SectionTitle title="Mais lidas" />
              <ol className="card-base divide-y divide-line overflow-hidden">
                {mostRead.length > 0 ? (
                  mostRead.map((p, i) => (
                    <li key={p.id} className="transition-colors hover:bg-surface">
                      <Link href={`/post/${p.slug}`} className="flex items-center gap-3 p-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-headline text-sm font-extrabold text-brand-dark">
                          {i + 1}
                        </span>
                        <span className="line-clamp-2 text-sm font-bold text-title">{p.title}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-sm text-muted">Sem dados ainda.</li>
                )}
              </ol>
            </aside>
          </div>
        </section>

        {afterLatest.map((section) => <DynamicSection key={section.id} section={section} />)}

        {/* Banner do meio */}
        <AdBanner placement="home_middle" />

        {beforeEvents.map((section) => <DynamicSection key={section.id} section={section} />)}

        {/* 4. Próximos eventos */}
        <section>
          <SectionTitle title="Próximos eventos" href="/eventos" linkLabel="ver agenda" />
          {events.length > 0 ? (
            <div className="rounded-lg border border-line bg-[#edf9f2] p-4">
              <ul className="divide-y divide-line">
                {events.map((p) => (
                  <li key={p.id}>
                    <Link href={`/post/${p.slug}`} className="flex items-center gap-3 py-3">
                      {p.event_start_date && <EventDateBox date={p.event_start_date} />}
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-title">{p.title}</span>
                        {p.event_location && (
                          <span className="block truncate text-sm text-muted">{p.event_location}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState title="Nenhum evento agendado" description="Fique de olho na nossa agenda." />
          )}
        </section>

        {/* 5. Guia local */}
        <section>
          <SectionTitle title="Guia local" href="/categorias/guia-local" linkLabel="ver guia" />
          {guides.length > 0 ? (
            <div className="grid gap-[18px] sm:grid-cols-3">
              {guides.map((p) => (
                <PostCard key={p.id} post={p} variant="compact" />
              ))}
            </div>
          ) : (
            <EmptyState title="Guia em construção" />
          )}
        </section>

        {beforeFooter.map((section) => <DynamicSection key={section.id} section={section} />)}
      </div>

      {/* 6. CTA anunciante — faixa neutra (tom alternado p/ contraste) */}
      <section className="mt-12 bg-section-alt">
        <div className="container-page flex flex-col items-center gap-3 py-6 text-center">
          <h2 className="font-headline text-2xl font-extrabold text-title md:text-[26px]">
            Anuncie no maior portal de Bom Jesus da Lapa
          </h2>
          <p className="max-w-xl text-sm text-body">
            Banners, posts patrocinados, eventos patrocinados e pacotes personalizados para o seu
            negócio alcançar moradores, romeiros e visitantes.
          </p>
          <Button href="/anuncie" size="lg" variant="accent">
            Quero anunciar
          </Button>
        </div>
      </section>
    </div>
  );
}

function DynamicSection({ section }: { section: Awaited<ReturnType<typeof listPublicHomeSections>>[number] }) {
  const href = section.show_view_all && section.view_all_mode !== 'hidden'
    ? section.view_all_mode === 'custom' ? section.custom_view_all_url ?? undefined : `/secoes/${section.slug}`
    : undefined;
  return <section aria-label={section.title}><SectionTitle title={section.title} href={href} linkLabel="ver tudo" />{section.subtitle && <p className="-mt-2 mb-4 text-sm text-muted">{section.subtitle}</p>}<HomeSectionCarousel posts={section.posts} /></section>;
}
