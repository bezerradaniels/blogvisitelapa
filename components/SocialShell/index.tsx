import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import SocialSidebarNav, { type SocialNavItem } from '@/components/SocialSidebarNav';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

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
    supabase.from('profile_details').select('nickname, city, relationship').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('scraps').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
    supabase.from('photo_albums').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id),
    supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('profile_id', profile.id).eq('status', 'aprovado'),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('status', 'aceito').or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`),
    supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
  ]);

  const displayName = details?.nickname ?? profile.full_name ?? 'Meu perfil';
  const items: SocialNavItem[] = [
    { href: '/rede', label: 'Feed' },
    { href: '/rede/perfil', label: 'Meu perfil' },
    { href: '/rede/recados', label: 'Recados', count: scraps ?? 0 },
    { href: '/mensagens', label: 'Mensagens' },
    { href: '/rede/fotos', label: 'Galeria', count: albums ?? 0 },
    { href: '/rede/depoimentos', label: 'Depoimentos', count: testimonials ?? 0 },
    { href: '/rede/amigos', label: 'Amigos', count: friends ?? 0 },
    { href: '/rede/comunidades', label: 'Comunidades', count: communities ?? 0 },
    { href: '/notificacoes', label: 'Notificações' },
  ];

  return (
    <div className="container-page py-6">
      <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="card-base overflow-hidden lg:sticky lg:top-24">
          <div className="border-b border-line p-5 text-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-brand-soft" />
            ) : (
              <span className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-brand-soft text-4xl font-extrabold text-brand-dark ring-4 ring-brand-soft">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <h1 className="mt-4 text-lg font-extrabold text-title">{displayName}</h1>
            {details?.relationship && <p className="mt-1 text-sm text-muted">{details.relationship}</p>}
            {details?.city && <p className="text-sm text-muted">{details.city}</p>}
          </div>
          <SocialSidebarNav items={items} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
