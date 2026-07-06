import { Suspense } from 'react';
import Icon from '@/components/Icon';
import AuthForm from '@/features/auth/AuthForm';
import { buildMetadata } from '@/lib/seo/metadata';

// Login dedicado à Rede Social: mesmo formulário de /login, porém com um visual
// mais divertido (rostos sorrindo + ícones de rede social).
export const metadata = buildMetadata({
  title: 'Entrar na Rede Social',
  path: '/login-rede-social',
  noindex: true,
});

// "Fotos de pessoas sorrindo" sem depender de imagens externas: bolhas de avatar
// com rostos (emoji) e um leve gradiente de marca.
const faces = [
  { emoji: '😄', ring: 'ring-white/50', pos: 'left-2 top-6 h-16 w-16 text-3xl' },
  { emoji: '🥰', ring: 'ring-white/40', pos: 'left-24 top-0 h-12 w-12 text-2xl' },
  { emoji: '😁', ring: 'ring-white/50', pos: 'right-6 top-4 h-20 w-20 text-4xl' },
  { emoji: '😎', ring: 'ring-white/40', pos: 'left-8 bottom-6 h-14 w-14 text-2xl' },
  { emoji: '😊', ring: 'ring-white/50', pos: 'right-4 bottom-2 h-16 w-16 text-3xl' },
  { emoji: '🙂', ring: 'ring-white/40', pos: 'right-28 bottom-10 h-11 w-11 text-xl' },
];

const perks: { icon: string; label: string }[] = [
  { icon: 'UserGroupIcon', label: 'Reencontre amigos e faça novas amizades' },
  { icon: 'FavouriteIcon', label: 'Deixe recados e depoimentos no mural' },
  { icon: 'Notification03Icon', label: 'Participe de comunidades e converse' },
  { icon: 'StarIcon', label: 'Monte seu perfil e compartilhe momentos' },
];

export default function LoginRedeSocialPage() {
  return (
    <div className="container-page py-8 md:py-12">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[24px] border border-line shadow-card md:grid-cols-2">
        {/* Painel divertido */}
        <aside className="relative overflow-hidden bg-gradient-to-br from-brand via-mint2 to-brand-dark p-6 text-white md:p-8">
          {/* Ícones sociais flutuantes (decorativos) */}
          <Icon icon="FavouriteIcon" size={26} className="absolute right-6 top-24 rotate-12 text-white/30" />
          <Icon icon="StarIcon" size={22} className="absolute left-1/2 top-10 text-white/25" />
          <Icon icon="UserGroupIcon" size={30} className="absolute bottom-24 right-10 text-white/25" />

          {/* Colagem de rostos sorrindo */}
          <div className="relative mx-auto h-40 w-full max-w-xs">
            {faces.map((f) => (
              <span
                key={f.emoji}
                className={`absolute flex items-center justify-center rounded-full bg-white/20 ring-2 backdrop-blur ${f.ring} ${f.pos}`}
              >
                {f.emoji}
              </span>
            ))}
          </div>

          <div className="relative mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Icon icon="UserGroupIcon" size={14} /> Rede Social
            </span>
            <h2 className="mt-3 font-headline text-2xl font-extrabold leading-tight text-white md:text-[28px]">
              A rede social de Bom Jesus da Lapa
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Reencontre amigos, compartilhe momentos e faça parte da comunidade lapense.
            </p>

            <ul className="mt-5 space-y-2.5">
              {perks.map((p) => (
                <li key={p.label} className="flex items-center gap-2.5 text-sm font-medium">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Icon icon={p.icon} size={16} className="text-white" />
                  </span>
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Formulário de login (mesmo de /login) — no mobile fica no topo */}
        <div className="order-first bg-card p-6 md:order-none md:p-8">
          <h1 className="text-2xl font-extrabold text-title">Entrar na Rede Social</h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            Acesse com sua conta do Conecta Lapa para entrar na rede social.
          </p>
          <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
