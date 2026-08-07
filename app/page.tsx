import Image from 'next/image';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import Button from '@/components/Button';
import CategoryCarousel from '@/components/CategoryCarousel';
import EmptyState from '@/components/EmptyState';
import PostCard from '@/components/PostCard';
import SectionTitle from '@/components/SectionTitle';
import HomeSectionCarousel from '@/components/HomeSectionCarousel';
import Icon from '@/components/Icon';
import { listPublicHomeSections } from '@/features/homeSections/queries';
import {
  listMostReadPosts,
  listPublishedPosts,
  listUpcomingEvents,
} from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';
import type { PostWithRelations } from '@/types/posts';

export const metadata = buildMetadata({
  description:
    `${siteConfig.slogan}. Leia artigos, descubra eventos e explore conteúdos locais ` +
    `sobre ${siteConfig.geo.city}, ${siteConfig.geo.stateCode}.`,
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
  const [featuredList, latest, events, mostRead, afterHero, afterLatest, beforeEvents, beforeFooter] = await Promise.all([
    listPublishedPosts({ featured: true, isEvent: false, limit: 3 }),
    listPublishedPosts({ isEvent: false, limit: 14 }),
    listUpcomingEvents(4),
    listMostReadPosts(5),
    listPublicHomeSections('after-hero'),
    listPublicHomeSections('after-latest-news'),
    listPublicHomeSections('before-events'),
    listPublicHomeSections('before-footer'),
  ]);

  const hero = featuredList[0] ?? latest[0];
  // Os destaques seguintes preenchem a lateral; os mais recentes completam a
  // faixa quando houver menos de três destaques. Nunca repete o post principal.
  const secondary = [...featuredList, ...latest]
    .filter((post, index, posts) => post.id !== hero?.id && posts.findIndex((item) => item.id === post.id) === index)
    .slice(0, 2);

  return (
    <div className="bg-card">
      {/* 1. Hero editorial — faixa neutra */}
      <section aria-label="Destaques" className="bg-section">
        <div className="container-page py-8">
          {hero ? (
            <div className="grid gap-4 lg:h-[440px] lg:grid-cols-[minmax(0,1.67fr)_minmax(0,1fr)] lg:grid-rows-2 xl:h-[500px]">
              <div className="lg:row-span-2">
                <PostCard post={hero} variant="hero-featured" />
              </div>
              <div className="grid gap-4 lg:contents">
                {secondary.map((p) => (
                  <PostCard key={p.id} post={p} variant="hero-side" />
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
        <EditorialShowcase articles={latest} />
        {afterHero.map((section) => <DynamicSection key={section.id} section={section} />)}
        {/* 2. Chips de categoria */}
        <CategoryCarousel />

        {/* Banner (contrato manual) — topo da home */}
        <AdBanner placement="home_top" />

        {/* 3. Últimos artigos */}
        <section>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionTitle title="Últimos artigos" href="/noticias" linkLabel="ver todos" />
              {latest.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {latest.slice(0, 8).map((p) => (
                    <div key={p.id} className="w-full">
                      <PostCard post={p} variant="mobile-horizontal" showSubtitle={false} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sem artigos por enquanto" />
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

function EditorialShowcase({ articles }: { articles: PostWithRelations[] }) {
  if (articles.length === 0) return null;

  const articleAt = (index: number) => articles[index % articles.length] as PostWithRelations;
  const lead = articleAt(0);
  const supporting = Array.from({ length: Math.min(4, Math.max(0, articles.length - 1)) }, (_, index) => articleAt(index + 1));
  const visualPosts = Array.from({ length: Math.min(3, articles.length) }, (_, index) => ({
    post: articleAt(index + 5),
    related: articleAt(index + 8),
  }));

  return (
    <section aria-label="Seleção de artigos" className="grid gap-6 border-b border-line pb-10 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <Link href={`/post/${lead.slug}`} className="group block max-w-5xl">
          <h2 className="font-headline text-[clamp(1.75rem,3.6vw,3.5rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-title transition-colors group-hover:text-brand">
            {lead.title}
          </h2>
        </Link>

        {supporting.length > 0 && (
          <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {supporting.map((article) => (
              <li key={article.id}>
                <ArticleHeadlineLink article={article} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 grid gap-6 border-t border-line pt-8 md:grid-cols-3">
          {visualPosts.map(({ post, related }, index) => (
            <article key={`${post.id}-${index}`} className="min-w-0">
              <Link href={`/post/${post.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-surface">
                  {post.cover_image_url ? (
                    <Image
                      src={post.cover_image_url}
                      alt={post.cover_image_alt ?? post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 28vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">Sem imagem</div>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-extrabold leading-snug text-title transition-colors group-hover:text-brand">
                  {post.title}
                </h3>
              </Link>
              {related.id !== post.id && (
                <div className="mt-4 border-t border-line pt-3">
                  <ArticleHeadlineLink article={related} compact />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <aside aria-label="Publicidade" className="mx-auto w-full max-w-[360px] xl:max-w-none">
        <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-section text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">Publicidade</span>
          <strong className="mt-2 text-lg text-title">1080 × 1350</strong>
          <span className="mt-1 text-xs text-muted">Espaço reservado</span>
        </div>
      </aside>
    </section>
  );
}

function ArticleHeadlineLink({ article, compact = false }: { article: PostWithRelations; compact?: boolean }) {
  return (
    <Link href={`/post/${article.slug}`} className="group flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand text-white" aria-hidden>
        <Icon icon="ArrowRight01Icon" size={12} strokeWidth={2.4} />
      </span>
      <span className={`${compact ? 'text-sm' : 'text-base'} font-bold leading-snug text-title transition-colors group-hover:text-brand`}>
        {article.title}
      </span>
    </Link>
  );
}

function DynamicSection({ section }: { section: Awaited<ReturnType<typeof listPublicHomeSections>>[number] }) {
  const href = section.show_view_all && section.view_all_mode !== 'hidden'
    ? section.view_all_mode === 'custom' ? section.custom_view_all_url ?? undefined : `/secoes/${section.slug}`
    : undefined;
  return <section aria-label={section.title}><SectionTitle title={section.title} href={href} linkLabel="ver tudo" />{section.subtitle && <p className="-mt-2 mb-4 text-sm text-muted">{section.subtitle}</p>}<HomeSectionCarousel posts={section.posts} /></section>;
}
