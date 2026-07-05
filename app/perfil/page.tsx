import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProfileForm from '@/features/profile/ProfileForm';
import FriendButton from '@/features/social/FriendButton';
import TestimonialModActions from '@/features/social/TestimonialModActions';
import { listFriendRequests, listPendingTestimonials } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo/metadata';
import type { ProfileDetails } from '@/types/social';

export const metadata = buildMetadata({ title: 'Meu perfil', path: '/perfil', noindex: true });

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login?redirect=/perfil');

  const supabase = await createClient();
  const { data: detailsData } = await supabase
    .from('profile_details')
    .select('*')
    .eq('profile_id', user.profile.id)
    .maybeSingle();
  const details = (detailsData as ProfileDetails | null) ?? null;

  const [requests, pendingTestimonials] = await Promise.all([
    listFriendRequests(user.profile.id),
    listPendingTestimonials(user.profile.id),
  ]);

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-title">Meu perfil</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        {user.profile.slug && (
          <Link href={`/u/${user.profile.slug}`} className="text-sm font-bold text-brand hover:underline">
            Ver meu perfil público →
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/favoritos" className="text-brand underline">
          Meus favoritos
        </Link>
        {user.isPublisher && (
          <Link href="/publisher" className="text-brand underline">
            Painel do publisher
          </Link>
        )}
        {user.isAdmin && (
          <Link href="/admin" className="text-brand underline">
            Painel admin
          </Link>
        )}
      </div>

      {/* Pedidos de amizade */}
      {requests.length > 0 && (
        <section className="card-base mb-6 p-4">
          <h2 className="mb-3 text-sm font-extrabold text-title">
            Pedidos de amizade ({requests.length})
          </h2>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <Link href={`/u/${r.slug}`} className="text-sm font-bold text-title hover:underline">
                  {r.full_name ?? 'Usuário'}
                </Link>
                <FriendButton
                  targetProfileId={r.id}
                  state="request_received"
                  isLogged
                  targetSlug={r.slug ?? ''}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Depoimentos pendentes */}
      {pendingTestimonials.length > 0 && (
        <section className="card-base mb-6 p-4">
          <h2 className="mb-3 text-sm font-extrabold text-title">
            Depoimentos aguardando aprovação ({pendingTestimonials.length})
          </h2>
          <ul className="space-y-3">
            {pendingTestimonials.map((t) => (
              <li key={t.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="mb-1 text-xs text-muted">
                  de{' '}
                  <Link href={`/u/${t.author?.slug}`} className="font-bold text-title hover:underline">
                    {t.author?.full_name ?? 'Usuário'}
                  </Link>
                </div>
                <p className="mb-2 whitespace-pre-wrap text-sm text-body">{t.content}</p>
                <TestimonialModActions testimonialId={t.id} status={t.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card-base p-5">
        <ProfileForm
          userId={user.userId}
          initial={{
            full_name: user.profile.full_name ?? '',
            bio: user.profile.bio ?? '',
            phone: user.profile.phone ?? '',
            avatar_url: user.profile.avatar_url ?? null,
            nickname: details?.nickname ?? '',
            city: details?.city ?? '',
            birth_date: details?.birth_date ?? '',
            relationship: details?.relationship ?? '',
            interests: details?.interests ?? '',
            about: details?.about ?? '',
            cover_url: details?.cover_url ?? null,
            visibility: details?.visibility ?? 'publico',
          }}
        />
      </div>
    </div>
  );
}
