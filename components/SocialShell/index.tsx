import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import SocialSidebarNav, { type SocialNavItem } from '@/components/SocialSidebarNav';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { titleCase } from '@/lib/utils/format';

export default async function SocialShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede');

  const { profile } = user;
  const supabase = await createClient();
  const [
    { data: details },
    { count: scraps },
    { count: albums },
    { count: testimonials },
    { count: friends },
    { count: communities },
  ] = await Promise.all([
    supabase.from('profile_details').select('nickname').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('scraps').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
    supabase.from('photo_albums').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
    supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'aprovado'),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('status', 'aceito').or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`),
    supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
  ]);

  const displayName = titleCase(profile.full_name) || details?.nickname || 'Meu perfil';
  const items: SocialNavItem[] = [
    { href: '/rede', label: 'Feed' },
    { href: '/rede/perfil', label: 'Perfil' },
    { href: '/rede/recados', label: 'Recados', count: scraps ?? 0 },
    { href: '/mensagens', label: 'Mensagens' },
    { href: '/rede/fotos', label: 'Fotos', count: albums ?? 0 },
    { href: '/rede/depoimentos', label: 'Depoimentos', count: testimonials ?? 0 },
    { href: '/rede/amigos', label: 'Amigos', count: friends ?? 0 },
    { href: '/rede/comunidades', label: 'Comunidades', count: communities ?? 0 },
    { href: '/notificacoes', label: 'Notificações' },
  ];

  return (
    <div className="container-page py-4 lg:py-6">
      <nav aria-label="Trilha" className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted lg:mb-5 lg:text-sm">
        <Link href="/" className="hover:text-brand">Início</Link>
        <span aria-hidden>›</span>
        <Link href="/rede" className="hover:text-brand">Rede Social</Link>
        <span aria-hidden>›</span>
        <span className="text-title">{displayName}</span>
      </nav>

      <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <aside className="card-base overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center gap-3 p-3 text-left lg:block lg:p-4 lg:text-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-[3px] ring-brand-soft lg:mx-auto lg:h-[104px] lg:w-[104px] lg:ring-4" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl font-extrabold text-brand-dark ring-[3px] ring-brand-soft lg:mx-auto lg:h-[104px] lg:w-[104px] lg:text-4xl lg:ring-4">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1 lg:block">
              <h1 className="truncate text-base font-extrabold leading-tight text-title lg:mt-4 lg:text-lg">{displayName}</h1>
              <div className="hidden lg:block">
                {profile.slug && <p className="mt-1 text-sm font-semibold text-brand">@{profile.slug}</p>}

                <hr className="my-4 border-line" />
                <div className="flex flex-col gap-2">
                  <Link
                    href="/perfil"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-bold text-brand hover:bg-surface"
                  >
                    Editar perfil
                  </Link>
                  <Link
                    href="/configuracoes"
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-bold text-brand hover:bg-surface"
                  >
                    Configurações
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <hr className="mx-4 hidden border-line lg:block" />
          <SocialSidebarNav items={items} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
