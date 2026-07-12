import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
import InteractionGate from '@/features/social/InteractionGate';
import TestimonialForm from '@/features/social/TestimonialForm';
import { getFriendState, getPublicProfile, listApprovedTestimonials } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo } from '@/lib/utils/format';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata({ title: 'Depoimentos', path: `/u/${slug}/depoimentos`, noindex: true });
}

export default async function ProfileTestimonialsPage({ params }: Props) {
  const { slug } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(slug), getCurrentUser()]);
  if (!profile) notFound();
  if (!profile.canView) return <PublicProfileShell profile={profile} slug={slug}><EmptyState title="Perfil restrito" /></PublicProfileShell>;
  const [testimonials, friendState] = await Promise.all([
    listApprovedTestimonials(profile.id),
    getFriendState(profile.id, viewer?.profile?.id ?? null),
  ]);
  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <section className="card-base p-4 sm:p-6">
        <h1 className="mb-5 text-2xl font-extrabold text-title">Depoimentos</h1>
        {friendState === 'friends' && <div className="mb-5"><TestimonialForm profileId={profile.id} /></div>}
        {friendState !== 'friends' && friendState !== 'self' && (
          <div className="mb-5">
            <InteractionGate
              kind="depoimento"
              isLogged={Boolean(viewer)}
              friendState={friendState}
              targetProfileId={profile.id}
              targetSlug={slug}
              targetName={profile.details?.nickname ?? profile.full_name ?? 'este usuário'}
            />
          </div>
        )}
        {testimonials.length > 0 ? (
          <ul className="divide-y divide-line">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                {testimonial.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={testimonial.author.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark">{(testimonial.author?.full_name ?? 'U').charAt(0)}</span>}
                <div className="min-w-0 flex-1"><div className="flex gap-2 text-xs text-muted"><Link href={`/u/${testimonial.author?.slug}`} className="font-bold text-brand hover:underline">{testimonial.author?.full_name ?? 'Usuário'}</Link><span>{timeAgo(testimonial.created_at)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm text-body">{testimonial.content}</p></div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="Nenhum depoimento aprovado" />}
      </section>
    </PublicProfileShell>
  );
}
