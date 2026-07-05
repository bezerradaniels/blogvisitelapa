import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import CommunityForm from '@/features/communities/CommunityForm';
import { getCommunityBySlug, getMembership } from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Configurações da comunidade', noindex: true });

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ConfiguracoesPage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const user = await getCurrentUser();
  if (!user?.profile) redirect(`/login?redirect=/comunidades/${slug}/configuracoes`);

  const membership = await getMembership(community.id, user.profile.id);
  const canManage =
    membership?.role === 'dono' || membership?.role === 'moderador' || user.isAdmin;
  if (!canManage) redirect(`/comunidades/${slug}`);

  return (
    <div className="container-page max-w-2xl py-8">
      <Link href={`/comunidades/${slug}`} className="text-sm font-bold text-brand hover:underline">
        ← {community.name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-title">Configurações da comunidade</h1>
      <CommunityForm
        userId={user.userId}
        community={{
          id: community.id,
          name: community.name,
          category: community.category,
          description: community.description,
          rules: community.rules,
          avatar_url: community.avatar_url,
          cover_image_url: community.cover_image_url,
        }}
      />
    </div>
  );
}
