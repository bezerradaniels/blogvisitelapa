import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import TestimonialModActions from '@/features/social/TestimonialModActions';
import { listApprovedTestimonials, listPendingTestimonials } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo, titleCase } from '@/lib/utils/format';

export const metadata = buildMetadata({ title: 'Meus depoimentos', path: '/rede/depoimentos', noindex: true });

export default async function RedeDepoimentosPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede/depoimentos');
  const [approved, pending] = await Promise.all([
    listApprovedTestimonials(user.profile.id),
    listPendingTestimonials(user.profile.id),
  ]);
  const all = [...pending, ...approved];
  return (
    <section className="card-base p-4 sm:p-6">
      <h1 className="mb-5 text-2xl font-extrabold text-title">Depoimentos</h1>
      {all.length > 0 ? (
        <ul className="divide-y divide-line">
          {all.map((testimonial) => (
            <li key={testimonial.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              {testimonial.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={testimonial.author.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark">{(testimonial.author?.full_name ?? 'U').charAt(0)}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Link href={`/u/${testimonial.author?.slug}`} className="font-bold text-brand hover:underline">{titleCase(testimonial.author?.full_name) || 'Usuário'}</Link>
                  <span>{timeAgo(testimonial.created_at)}</span>
                </div>
                <p className="my-2 whitespace-pre-wrap text-sm text-body">{testimonial.content}</p>
                <TestimonialModActions testimonialId={testimonial.id} status={testimonial.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Nenhum depoimento ainda" />}
    </section>
  );
}
