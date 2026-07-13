import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import MemberModActions from '@/features/communities/MemberModActions';
import { getCommunityBySlug, getMembership, listMembers } from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { titleCase } from '@/lib/utils/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return buildMetadata({
    title: community ? `Membros — ${community.name}` : 'Membros',
    path: `/comunidades/${slug}/membros`,
    noindex: true,
  });
}

const ROLE_LABEL: Record<string, string> = {
  dono: 'Dono',
  moderador: 'Moderador',
  membro: 'Membro',
};

export default async function MembrosPage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [user, members] = await Promise.all([getCurrentUser(), listMembers(community.id)]);
  const membership = await getMembership(community.id, user?.profile?.id ?? null);
  const canManage = membership?.role === 'dono' || Boolean(user?.isAdmin);

  return (
    <div className="container-page max-w-2xl py-8">
      <Link href={`/comunidades/${slug}`} className="text-sm font-bold text-brand hover:underline">
        ← {community.name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-title">
        Membros ({community.member_count})
      </h1>

      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="card-base flex items-center gap-3 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark">
              {m.profile?.avatar_url ? (
                <Image src={m.profile.avatar_url} alt="" width={40} height={40} className="object-cover" />
              ) : (
                (m.profile?.full_name ?? 'M').charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1">
              {m.profile?.slug ? (
                <Link href={`/u/${m.profile.slug}`} className="block truncate font-bold text-title hover:underline">
                  {titleCase(m.profile.full_name) || 'Membro'}
                </Link>
              ) : (
                <p className="truncate font-bold text-title">{titleCase(m.profile?.full_name) || 'Membro'}</p>
              )}
              <Badge tone={m.role === 'dono' ? 'brand' : m.role === 'moderador' ? 'accent' : 'neutral'}>
                {ROLE_LABEL[m.role] ?? m.role}
              </Badge>
            </div>
            {canManage && m.role !== 'dono' && <MemberModActions memberId={m.id} role={m.role} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
