import Link from 'next/link';
import AdCardGrid from '@/components/AdCardGrid';
import Icon from '@/components/Icon';

const links = [
  { href: '/noticias', label: 'Mais notícias', icon: 'News01Icon' },
  { href: '/noticias?categoria=cotidiano', label: 'Mais em Cotidiano', icon: 'Tag01Icon' },
  { href: '/eventos', label: 'Eventos', icon: 'Calendar03Icon' },
  { href: '/rede', label: 'Rede social', icon: 'UserGroupIcon' },
];

// Coluna de descoberta da área de notícias.
export default async function NewsExploreSidebar() {
  return (
    <aside className="space-y-5 lg:sticky lg:top-20">
      <section className="card-base p-4 sm:p-5">
        <h2 className="text-xl font-extrabold text-title">Navegue</h2>
        <nav aria-label="Navegação complementar" className="mt-4 space-y-1">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-base font-bold text-title hover:bg-surface hover:text-brand">
              <Icon icon={item.icon} size={22} className="text-title" />
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      <AdCardGrid placement="post_sidebar" limit={3} />
    </aside>
  );
}
