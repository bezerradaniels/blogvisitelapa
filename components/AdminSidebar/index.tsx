// Navegação lateral do painel administrativo.
import Link from 'next/link';
import Icon from '@/components/Icon';

const links = [
  { href: '/admin', label: 'Visão geral', icon: 'Analytics01Icon' },
  { href: '/admin/posts', label: 'Posts', icon: 'File01Icon' },
  { href: '/admin/categorias', label: 'Categorias', icon: 'Tag01Icon' },
  { href: '/admin/tags', label: 'Tags', icon: 'Tag01Icon' },
  { href: '/admin/comentarios', label: 'Comentários', icon: 'UserGroupIcon' },
  { href: '/admin/avaliacoes', label: 'Avaliações', icon: 'StarIcon' },
  { href: '/admin/contatos', label: 'Contatos', icon: 'Mail01Icon' },
  { href: '/admin/anunciantes', label: 'Anunciantes', icon: 'Megaphone01Icon' },
  { href: '/admin/clientes-comerciais', label: 'Clientes', icon: 'UserGroupIcon' },
  { href: '/admin/publicidade', label: 'Publicidade', icon: 'Image01Icon' },
  { href: '/admin/contratos', label: 'Contratos', icon: 'File01Icon' },
  { href: '/admin/produtos-avulsos', label: 'Produtos avulsos', icon: 'Tag01Icon' },
  { href: '/admin/usuarios', label: 'Usuários', icon: 'UserIcon' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: 'Settings01Icon' },
  { href: '/admin/auditoria', label: 'Auditoria', icon: 'Analytics01Icon' },
];

export default function AdminSidebar() {
  return (
    <nav aria-label="Menu do painel" className="space-y-0.5">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex items-center gap-2 rounded px-2.5 py-2 text-sm text-body hover:bg-surface hover:text-brand"
        >
          <Icon icon={l.icon} size={18} />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
