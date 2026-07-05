import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import TopicForm from '@/features/communities/TopicForm';
import { getCommunityBySlug, getMembership } from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Novo tópico', noindex: true });

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NovoTopicoPage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const user = await getCurrentUser();
  if (!user?.profile) redirect(`/login?redirect=/comunidades/${slug}/topicos/novo`);

  const membership = await getMembership(community.id, user.profile.id);
  if (!membership) redirect(`/comunidades/${slug}`);

  return (
    <div className="container-page max-w-2xl py-8">
      <Link href={`/comunidades/${slug}`} className="text-sm font-bold text-brand hover:underline">
        ← {community.name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-title">Novo tópico</h1>
      <TopicForm communityId={community.id} communitySlug={slug} />
    </div>
  );
}
