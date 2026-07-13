import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import DeleteScrapButton from '@/features/social/DeleteScrapButton';
import { listScraps } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo, titleCase } from '@/lib/utils/format';

export const metadata = buildMetadata({ title: 'Meus recados', path: '/rede/recados', noindex: true });

export default async function RecadosPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede/recados');
  const scraps = await listScraps(user.profile.id);

  return (
    <section className="card-base p-4 sm:p-6">
      <h1 className="mb-5 text-2xl font-extrabold text-title">Recados</h1>
      {scraps.length > 0 ? (
        <ul className="divide-y divide-line">
          {scraps.map((scrap) => (
            <li key={scrap.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              {scrap.author?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scrap.author.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark">{(scrap.author?.full_name ?? 'U').charAt(0)}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Link href={`/u/${scrap.author?.slug}`} className="font-bold text-brand hover:underline">{titleCase(scrap.author?.full_name) || 'Usuário'}</Link>
                  <span>{timeAgo(scrap.created_at)}</span>
                  <span className="ml-auto"><DeleteScrapButton scrapId={scrap.id} /></span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-body">{scrap.content}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Nenhum recado ainda" description="Os recados deixados por seus amigos aparecerão aqui." />}
    </section>
  );
}
