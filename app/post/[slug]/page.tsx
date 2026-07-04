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
  listMostReadPosts,
  listPublishedPosts,
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

  const [related, latest, mostRead, sponsorLabel, comments, userState] = await Promise.all([
    listRelatedPosts(post, 3),
    listPublishedPosts({ limit: 5, excludeId: post.id }),
    listMostReadPosts(5),
    getSponsorLabel(post.id),
    listApprovedComments(post.id),
    getUserPostState(post.id, profileId),
  ]);

  // Registra a visualização (não bloqueia a renderização).
  void registerPostView(post.id);

  const safeHtml = post.content_html ? sanitizePostHtml(post.content_html) : '';
  const publishDate = post.published_at ?? post.created_at;

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
    <div className="container-page py-6">
      <JsonLd data={schemas} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna principal */}
        <article className="lg:col-span-2">
          {/* 1. Categoria + rótulos */}
          <div className="flex flex-wrap items-center gap-2">
            {post.category && (
              <Link href={`/categorias/${post.category.slug}`}>
                <Badge tone="brand">{post.category.name}</Badge>
              </Link>
            )}
            {post.is_sponsored && <Badge tone="sponsored">{sponsorLabel ?? 'Conteúdo patrocinado'}</Badge>}
            {post.content_type === 'publieditorial' && <Badge tone="warning">Publieditorial</Badge>}
          </div>

          {/* 2. Título / 3. Subtítulo */}
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-title md:text-3xl">
            {post.title}
          </h1>
          {post.subtitle && <p className="mt-2 text-base text-muted md:text-lg">{post.subtitle}</p>}

          {/* Assinatura: autor + datas */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {post.author && (
              <span>
                Por{' '}
                {post.author.slug ? (
                  <Link href={`/autor/${post.author.slug}`} className="font-medium text-title hover:text-brand">
                    {post.author.full_name}
                  </Link>
                ) : (
                  <span className="font-medium text-title">{post.author.full_name}</span>
                )}
              </span>
            )}
          </div>

          {/* 4. Data centralizada acima da capa */}
          <p className="mt-4 text-center text-xs text-muted">
            Publicado em <time dateTime={publishDate}>{formatDateTime(publishDate)}</time>
            {post.updated_at !== publishDate && (
              <> · Atualizado em {formatDate(post.updated_at)}</>
            )}
          </p>

          {/* 5. Capa 16:10 */}
          {post.cover_image_url && (
            <figure className="mt-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-surface">
                <Image
                  src={post.cover_image_url}
                  alt={post.cover_image_alt ?? post.title}
                  fill
                  sizes="(max-width:1024px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
              </div>
              {post.cover_image_alt && (
                <figcaption className="mt-1 text-center text-xs text-muted">
                  {post.cover_image_alt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Dados do evento */}
          {post.is_event && (
            <div className="card-base mt-4 grid gap-2 p-4 text-sm sm:grid-cols-2">
              {post.event_start_date && (
                <p><strong>Início:</strong> {formatDateTime(post.event_start_date)}</p>
              )}
              {post.event_end_date && (
                <p><strong>Término:</strong> {formatDateTime(post.event_end_date)}</p>
              )}
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

          {/* 6. Corpo do artigo (sanitizado) */}
          {safeHtml && (
            <div className="prose-post mt-6" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          )}

          {/* Fonte / nota editorial */}
          {post.source_note && (
            <p className="mt-6 border-t border-line pt-3 text-xs text-muted">
              <strong>Fonte:</strong> {post.source_note}
            </p>
          )}

          {/* 7. Relacionados */}
          {related.length > 0 && (
            <section className="mt-8">
              <SectionTitle title="Leia também" />
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.id} post={p} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {/* 8. Banner inline (mobile) */}
          <div className="mt-8 lg:hidden">
            <AdBanner placement="post_inline_mobile" />
          </div>

          {/* 10. Avaliações / 11. Favorito */}
          <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <RatingStars
              postId={post.id}
              profileId={profileId}
              initialUserRating={userState.userRating}
              average={post.rating_avg}
              count={post.rating_count}
            />
            <FavoriteButton postId={post.id} profileId={profileId} initialFavorited={userState.favorited} />
          </div>

          {/* 9. Comentários */}
          <div className="mt-8 border-t border-line pt-6">
            <Comments postId={post.id} profileId={profileId} initialComments={comments} />
          </div>
        </article>

        {/* Sidebar (desktop) — vira abaixo do artigo no mobile */}
        <aside className="space-y-6">
          <AdBanner placement="post_sidebar" ratio="aspect-[3/4]" />

          <section>
            <SectionTitle title="Últimas do blog" href="/noticias" />
            <ul className="card-base divide-y divide-line">
              {latest.map((p) => (
                <li key={p.id}>
                  <Link href={`/post/${p.slug}`} className="block p-3 hover:bg-surface">
                    <span className="line-clamp-2 text-sm font-medium text-title">{p.title}</span>
                    <time className="text-xs text-muted" dateTime={p.published_at ?? p.created_at}>
                      {formatDate(p.published_at ?? p.created_at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionTitle title="Mais lidas do blog" />
            <ol className="card-base divide-y divide-line">
              {mostRead.map((p, i) => (
                <li key={p.id}>
                  <Link href={`/post/${p.slug}`} className="flex gap-3 p-3 hover:bg-surface">
                    <span className="font-headline text-lg font-bold text-brand">{i + 1}</span>
                    <span className="line-clamp-2 text-sm font-medium text-title">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
