import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdBanner from '@/components/AdBanner';
import AdCardGrid from '@/components/AdCardGrid';
import Badge from '@/components/Badge';
import Icon from '@/components/Icon';
import JsonLd from '@/components/JsonLd';
import PostCard from '@/components/PostCard';
import SectionTitle from '@/components/SectionTitle';
import Comments from '@/features/engagement/Comments';
import { listApprovedComments } from '@/features/engagement/queries';
import {
  getPostBySlug,
  getSponsorLabel,
  listMostReadPosts,
  listPublishedPosts,
  listRelatedPosts,
  registerPostView,
} from '@/features/posts/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { articleSchema, breadcrumbSchema, eventSchema } from '@/lib/seo/schema';
import { sanitizePostHtml } from '@/lib/utils/sanitize';
import { formatDate, formatDateTime, titleCase } from '@/lib/utils/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return buildMetadata({ title: 'Conteúdo não encontrado', noindex: true });

  return buildMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    path: `/post/${post.slug}`,
    image: post.social_image_url ?? post.cover_image_url,
    type: 'article',
    noindex: !post.allow_indexing,
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    authors: post.author?.full_name ? [post.author.full_name] : undefined,
    keywords: [post.focus_keyword, post.local_seo_keyword].filter(Boolean) as string[],
  });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const user = await getCurrentUser();
  const profileId = user?.profile?.id ?? null;

  const [related, sponsorLabel, comments, mostReadPosts, latestPosts] = await Promise.all([
    listRelatedPosts(post, 3),
    getSponsorLabel(post.id),
    listApprovedComments(post.id),
    listMostReadPosts(5),
    listPublishedPosts({ limit: 5 }),
  ]);
  const mostRead = mostReadPosts.filter((item) => item.id !== post.id).slice(0, 4);
  const latest = latestPosts.filter((item) => item.id !== post.id).slice(0, 4);

  void registerPostView(post.id);

  const safeHtml = post.content_html ? sanitizePostHtml(post.content_html) : '';
  const publishDate = post.published_at ?? post.created_at;
  const authorInitial = (post.author?.full_name ?? 'R').charAt(0).toUpperCase();

  const schemas = [
    articleSchema(post),
    breadcrumbSchema([
      { name: 'Início', path: '/' },
      ...(post.category ? [{ name: post.category.name, path: `/categorias/${post.category.slug}` }] : []),
      { name: post.title, path: `/post/${post.slug}` },
    ]),
  ];
  const evtSchema = eventSchema(post);
  if (evtSchema) schemas.push(evtSchema);

  return (
    <article className="container-page py-8">
      <JsonLd data={schemas} />

      {/* Publicidade no topo do artigo: apenas mobile, antes da trilha. */}
      <div className="mb-6 md:hidden">
        <AdBanner placement="post_inline_mobile" ratio="aspect-[728/90]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,760px)_280px] lg:items-start xl:gap-10">
        <div className="min-w-0">
        {/* Breadcrumb */}
        <nav aria-label="Trilha" className="mb-4 text-xs font-semibold text-muted">
          <Link href="/" className="hover:text-brand">Início</Link>
          {post.category && (
            <>
              {' › '}
              <Link href={`/categorias/${post.category.slug}`} className="hover:text-brand">
                {post.category.name}
              </Link>
            </>
          )}
          {' › '}
          <span className="text-body">{post.title.slice(0, 40)}{post.title.length > 40 ? '…' : ''}</span>
        </nav>

        {/* Cabeçalho */}
        <header>
          <div className="flex flex-wrap gap-2">
            {post.category && (
              <Link href={`/categorias/${post.category.slug}`}>
                <Badge tone="brand">{post.category.name}</Badge>
              </Link>
            )}
            {post.is_sponsored && <Badge tone="sponsored">{sponsorLabel ?? 'Conteúdo patrocinado'}</Badge>}
            {post.content_type === 'publieditorial' && <Badge tone="warning">Publieditorial</Badge>}
          </div>

          <h1 className="mt-3 font-headline text-[32px] font-extrabold leading-[1.18] text-title md:text-[38px]">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-3 text-lg text-muted">{post.subtitle}</p>
          )}

          {/* Assinatura: avatar-inicial + autor + datas */}
          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-headline text-base font-extrabold text-brand-dark">
              {authorInitial}
            </span>
            <div className="text-left text-xs text-muted">
              {post.author && (
                <p className="text-sm font-bold text-title">
                  {post.author.slug ? (
                    <Link href={`/autor/${post.author.slug}`} className="hover:text-brand">{titleCase(post.author.full_name)}</Link>
                  ) : (
                    titleCase(post.author.full_name)
                  )}
                </p>
              )}
              <p>
                Publicado em <time dateTime={publishDate}>{formatDateTime(publishDate)}</time>
                {new Date(post.updated_at).getTime() > new Date(publishDate).getTime() && <> · Atualizado {formatDate(post.updated_at)}</>}
              </p>
            </div>
          </div>
        </header>

        {/* Capa 16:10 arredondada */}
        {post.cover_image_url && (
          <figure className="mt-6">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[26px] bg-surface">
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt ?? post.title}
                fill
                sizes="(max-width:1024px) 100vw, 760px"
                className="object-cover"
                priority
              />
            </div>
            {post.cover_image_alt && (
              <figcaption className="mt-2 text-center text-xs text-muted">{post.cover_image_alt}</figcaption>
            )}
          </figure>
        )}

        {/* Dados do evento */}
        {post.is_event && (
          <div className="card-base mt-6 grid gap-2 p-4 text-sm sm:grid-cols-2">
            {post.event_start_date && <p><strong>Início:</strong> {formatDateTime(post.event_start_date)}</p>}
            {post.event_end_date && <p><strong>Término:</strong> {formatDateTime(post.event_end_date)}</p>}
            {post.event_location && <p><strong>Local:</strong> {post.event_location}</p>}
            {post.event_address && <p><strong>Endereço:</strong> {post.event_address}</p>}
            {post.event_organizer && <p><strong>Organização:</strong> {post.event_organizer}</p>}
            {post.event_is_free ? (
              <p><strong>Entrada:</strong> Gratuita</p>
            ) : post.event_ticket_price ? (
              <p><strong>Ingresso:</strong> {post.event_ticket_price}</p>
            ) : (
              post.event_ticket_url && (
                <p><a className="text-brand underline" href={post.event_ticket_url} target="_blank" rel="noopener noreferrer">Ingressos</a></p>
              )
            )}
            {post.event_map_url && (
              <p><a className="text-brand underline" href={post.event_map_url} target="_blank" rel="noopener noreferrer">Ver no mapa</a></p>
            )}
          </div>
        )}

        {/* Corpo (17px / line-height 1.75) */}
        {safeHtml && (
          <div
            className="prose-post mt-8 text-[17px] leading-[1.75]"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        )}

        {post.source_note && (
          <p className="mt-6 border-t border-line pt-3 text-xs text-muted">
            <strong>Fonte:</strong> {post.source_note}
          </p>
        )}

        {/* Comentários */}
        <div className="mt-8">
          <Comments postId={post.id} profileId={profileId} initialComments={comments} />
        </div>

          {related.length > 0 && (
            <section className="mt-12">
              <SectionTitle title="Leia também" />
              <div className="grid gap-[18px] sm:grid-cols-2">
                {related.map((p) => (
                  <PostCard key={p.id} post={p} variant="compact" />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20">
          <section className="card-base p-4">
            <h2 className="mb-3 text-base font-extrabold text-title">Navegue</h2>
            <nav aria-label="Navegação relacionada" className="space-y-1">
              <Link
                href="/noticias"
                className="flex min-h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-bold text-body hover:bg-surface hover:text-brand"
              >
                <Icon icon="News01Icon" size={18} />
                Mais notícias
              </Link>
              {post.category && (
                <Link
                  href={`/categorias/${post.category.slug}`}
                  className="flex min-h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-bold text-body hover:bg-surface hover:text-brand"
                >
                  <Icon icon={post.category.icon_name ?? 'Tag01Icon'} size={18} />
                  Mais em {post.category.name}
                </Link>
              )}
              <Link
                href="/eventos"
                className="flex min-h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-bold text-body hover:bg-surface hover:text-brand"
              >
                <Icon icon="Calendar03Icon" size={18} />
                Eventos
              </Link>
              <Link
                href="https://conectalapa.com.br/login-rede-social"
                className="flex min-h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-bold text-body hover:bg-surface hover:text-brand"
              >
                <Icon icon="UserGroupIcon" size={18} />
                Rede social
              </Link>
            </nav>
          </section>

          <section className="card-base p-4">
            <h2 className="mb-3 text-base font-extrabold text-title">Mais lidos</h2>
            {mostRead.length > 0 ? (
              <ol className="space-y-1">
                {mostRead.map((item, index) => (
                  <li key={item.id}>
                    <Link
                      href={`/post/${item.slug}`}
                      className="flex gap-3 rounded-[10px] p-2 hover:bg-surface"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-extrabold text-brand-dark">
                        {index + 1}
                      </span>
                      <span className="line-clamp-2 text-sm font-bold leading-snug text-title hover:text-brand">
                        {item.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">Ainda não há outras notícias mais lidas.</p>
            )}
          </section>

          <section className="card-base p-4">
            <h2 className="mb-3 text-base font-extrabold text-title">Últimos posts</h2>
            {latest.length > 0 ? (
              <ul className="space-y-1">
                {latest.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/post/${item.slug}`}
                      className="block rounded-[10px] p-2 text-sm font-bold leading-snug text-title hover:bg-surface hover:text-brand"
                    >
                      <span className="line-clamp-2">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Ainda não há outros posts publicados.</p>
            )}
          </section>

          <AdCardGrid placement="post_sidebar" className="hidden lg:block" />
        </aside>
      </div>
    </article>
  );
}
