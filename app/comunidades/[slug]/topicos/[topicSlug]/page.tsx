import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import RemoveReplyButton from '@/features/communities/RemoveReplyButton';
import ReplyBox from '@/features/communities/ReplyBox';
import ReportButton from '@/features/communities/ReportButton';
import TopicModActions from '@/features/communities/TopicModActions';
import {
  getCommunityBySlug,
  getMembership,
  getTopic,
  listReplies,
} from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDateTime, timeAgo, titleCase } from '@/lib/utils/format';

interface Props {
  params: Promise<{ slug: string; topicSlug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, topicSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return buildMetadata({ title: 'Tópico', noindex: true });
  const topic = await getTopic(community.id, topicSlug);
  // Conteúdo de usuário: não indexar.
  return buildMetadata({
    title: topic ? `${topic.title} — ${community.name}` : 'Tópico',
    path: `/comunidades/${slug}/topicos/${topicSlug}`,
    noindex: true,
  });
}

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark">
      {url ? (
        <Image src={url} alt="" width={36} height={36} className="object-cover" />
      ) : (
        (name ?? 'M').charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default async function TopicoPage({ params }: Props) {
  const { slug, topicSlug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const topic = await getTopic(community.id, topicSlug);
  if (!topic || topic.status !== 'visivel') notFound();

  const [user, replies] = await Promise.all([getCurrentUser(), listReplies(topic.id)]);
  const membership = await getMembership(community.id, user?.profile?.id ?? null);
  const isMember = Boolean(membership);
  const isModerator =
    membership?.role === 'dono' || membership?.role === 'moderador' || Boolean(user?.isAdmin);

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href={`/comunidades/${slug}`} className="text-sm font-bold text-brand hover:underline">
        ← {community.name}
      </Link>

      {/* Tópico */}
      <article className="card-base mt-2 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {topic.is_pinned && <Badge tone="highlight">Fixado</Badge>}
          {topic.is_locked && <Badge tone="neutral">Fechado</Badge>}
          <h1 className="text-xl font-extrabold text-title">{topic.title}</h1>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Avatar url={topic.author?.avatar_url ?? null} name={topic.author?.full_name ?? null} />
          <div className="text-xs text-muted">
            <span className="font-bold text-title">{titleCase(topic.author?.full_name) || 'Membro'}</span>
            <span className="block">{formatDateTime(topic.created_at)}</span>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{topic.content}</p>
        <div className="mt-3 flex items-center gap-3">
          <ReportButton targetType="topico" targetId={topic.id} />
          {isModerator && (
            <TopicModActions
              topicId={topic.id}
              communitySlug={slug}
              isPinned={topic.is_pinned}
              isLocked={topic.is_locked}
            />
          )}
        </div>
      </article>

      {/* Respostas */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-extrabold text-title">
          {replies.length} {replies.length === 1 ? 'resposta' : 'respostas'}
        </h2>
        <ul className="space-y-3">
          {replies.map((r) => (
            <li key={r.id} className="card-base flex gap-3 p-3">
              <Avatar url={r.author?.avatar_url ?? null} name={r.author?.full_name ?? null} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2 text-xs text-muted">
                  <span className="font-bold text-title">{titleCase(r.author?.full_name) || 'Membro'}</span>
                  <span>{timeAgo(r.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{r.content}</p>
                <div className="mt-1 flex items-center gap-3">
                  <ReportButton targetType="resposta" targetId={r.id} />
                  {isModerator && <RemoveReplyButton replyId={r.id} />}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <ReplyBox
            topicId={topic.id}
            canReply={isMember && !topic.is_locked}
            isLogged={Boolean(user)}
            isMember={isMember}
            isLocked={topic.is_locked}
            communitySlug={slug}
          />
        </div>
      </section>
    </div>
  );
}
