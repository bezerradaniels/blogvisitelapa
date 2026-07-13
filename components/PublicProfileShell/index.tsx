import Link from 'next/link';
import type { ReactNode } from 'react';
import SocialSidebarNav, { type SocialNavItem } from '@/components/SocialSidebarNav';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { titleCase } from '@/lib/utils/format';
import type { PublicProfile } from '@/types/social';

interface PublicProfileShellProps {
  profile: PublicProfile;
  slug: string;
  children: ReactNode;
}

export default async function PublicProfileShell({ profile, slug, children }: PublicProfileShellProps) {
  const [viewer, supabase] = await Promise.all([getCurrentUser(), createClient()]);
  const [{ count: posts }, { count: scraps }, { count: albums }, { count: testimonials }, { count: communities }] =
    await Promise.all([
      supabase.from('social_posts').select('id', { count: 'exact', head: true }).eq('author_id', profile.id).is('repost_of', null),
      supabase.from('scraps').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
      supabase.from('photo_albums').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'aprovado'),
      supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    ]);
  const details = profile.details;
  const displayName = titleCase(profile.full_name) || details?.nickname || 'Usuário';
  const isOwner = viewer?.profile?.id === profile.id;
  const items: SocialNavItem[] = [
    { href: `/u/${slug}`, label: 'Perfil', exact: true },
    { href: `/u/${slug}/feed`, label: 'Feed', count: posts ?? 0 },
    { href: `/u/${slug}/recados`, label: 'Recados', count: scraps ?? 0 },
    { href: `/u/${slug}/fotos`, label: 'Fotos', count: albums ?? 0 },
    { href: `/u/${slug}/depoimentos`, label: 'Depoimentos', count: testimonials ?? 0 },
    { href: `/u/${slug}/amigos`, label: 'Amigos', count: profile.friendCount },
    { href: `/u/${slug}/comunidades`, label: 'Comunidades', count: communities ?? 0 },
  ];

  return (
    <div className="container-page py-4 lg:py-6">
      <nav aria-label="Trilha" className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted lg:mb-5 lg:text-sm">
        <Link href="/" className="hover:text-brand">Início</Link>
        <span aria-hidden>›</span>
        <span>Perfis</span>
        <span aria-hidden>›</span>
        <Link href={`/u/${slug}`} className="text-title hover:text-brand">{displayName}</Link>
      </nav>
      <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <aside className="card-base overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center gap-3 p-3 text-left lg:block lg:p-4 lg:text-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover ring-[3px] ring-brand-soft lg:mx-auto lg:h-[104px] lg:w-[104px] lg:ring-4" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl font-extrabold text-brand-dark ring-[3px] ring-brand-soft lg:mx-auto lg:h-[104px] lg:w-[104px] lg:text-4xl lg:ring-4">{displayName.charAt(0).toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1 lg:block">
              <h1 className="truncate text-base font-extrabold leading-tight text-title lg:mt-4 lg:text-lg">{displayName}</h1>
              <div className="hidden lg:block">
                <p className="mt-1 text-sm font-semibold text-brand">@{slug}</p>
                {isOwner && (
                  <>
                    <hr className="my-4 border-line" />
                    <Link href="/perfil" className="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-bold text-brand hover:bg-surface">Editar perfil</Link>
                  </>
                )}
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
