import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdBanner from '@/components/AdBanner';
import Badge from '@/components/Badge';
import JsonLd from '@/components/JsonLd';
import PostCard from '@/components/PostCard';
import SectionTitle from '@/components/SectionTitle';
import Comments from '@/features/engagement/Comments';
import FavoriteButton from '@/features/engagement/FavoriteButton';
import RatingStars from '@/features/engagement/RatingStars';
import { getUserPostState, listApprovedComments } from '@/features/engagement/queries';
import {
  getPostBySlug,
  getSponsorLabel,
  listRelatedPosts,
  registerPostView,
} from '@/features/posts/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { articleSchema, breadcrumbSchema, eventSchema } from '@/lib/seo/schema';
import { sanitizePostHtml } from '@/lib/utils/sanitize';
import { formatDate, formatDateTime } from '@/lib/utils/format';

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

  const [related, sponsorLabel, comments, userState] = await Promise.all([
    listRelatedPosts(post, 3),
    getSponsorLabel(post.id),
    listApprovedComments(post.id),
    getUserPostState(post.id, profileId),
  ]);

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

      <div className="mx-auto max-w-[760px]">
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

        {/* Cabeçalho centralizado */}
        <header className="text-center">
          <div className="flex flex-wrap justify-center gap-2">
            {post.category && (
              <Link href={`/categorias/${post.category.slug}`}>
                <Badge tone="brand">{post.category.name}</Badge>
              </Link>
            )}
            {post.is_sponsored && <Badge tone="sponsored">{sponsorLabel ?? 'Conteúdo patrocinado'}</Badge>}
            {post.content_type === 'publieditorial' && <Badge tone="warning">Publieditorial</Badge>}
          </div>

          <h1 className="mx-auto mt-3 max-w-[16ch] font-headline text-[32px] font-extrabold leading-[1.18] text-title md:text-[38px]">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mx-auto mt-3 max-w-[46ch] text-lg text-muted">{post.subtitle}</p>
          )}

          {/* Assinatura: avatar-inicial + autor + datas */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-headline text-base font-extrabold text-brand-dark">
              {authorInitial}
            </span>
            <div className="text-left text-xs text-muted">
              {post.author && (
                <p className="text-sm font-bold text-title">
                  {post.author.slug ? (
                    <Link href={`/autor/${post.author.slug}`} className="hover:text-brand">{post.author.full_name}</Link>
                  ) : (
                    post.author.full_name
                  )}
                </p>
              )}
              <p>
                Publicado em <time dateTime={publishDate}>{formatDateTime(publishDate)}</time>
                {post.updated_at !== publishDate && <> · Atualizado {formatDate(post.updated_at)}</>}
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
                sizes="(max-width:800px) 100vw, 760px"
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
            {post.event_ticket_url && (
              <p><a className="text-brand underline" href={post.event_ticket_url} target="_blank" rel="noopener noreferrer">Ingressos</a></p>
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

        {/* Barra de engajamento */}
        <div className="card-base mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 font-headline text-base font-extrabold text-title">Gostou da matéria?</p>
            <RatingStars
              postId={post.id}
              profileId={profileId}
              initialUserRating={userState.userRating}
              average={post.rating_avg}
              count={post.rating_count}
            />
          </div>
          <FavoriteButton postId={post.id} profileId={profileId} initialFavorited={userState.favorited} />
        </div>

        {/* Banner inline */}
        <div className="mt-8">
          <AdBanner placement="post_inline_mobile" />
        </div>

        {/* Comentários */}
        <div className="mt-8">
          <Comments postId={post.id} profileId={profileId} initialComments={comments} />
        </div>
      </div>

      {/* Leia também — largura total */}
      {related.length > 0 && (
        <section className="mx-auto mt-12 max-w-content">
          <SectionTitle title="Leia também" />
          <div className="grid gap-[18px] sm:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
