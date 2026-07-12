// Arquitetura de informação das Configurações. `ready` marca o que já existe
// (Fase 1); os demais aparecem como "em breve" para comunicar o roteiro sem
// links quebrados. Rótulos seguem o tom em pt-BR do portal.
export interface SettingsNavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  ready: boolean;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    href: '/configuracoes/conta',
    label: 'Conta',
    icon: 'UserIcon',
    description: 'Nome, usuário, e-mail e telefone.',
    ready: true,
  },
  {
    href: '/configuracoes/perfil',
    label: 'Perfil e privacidade',
    icon: 'SquareLock02Icon',
    description: 'Seus dados e quem pode ver cada campo.',
    ready: true,
  },
  {
    href: '/configuracoes/privacidade',
    label: 'Privacidade',
    icon: 'GlobalIcon',
    description: 'Ver como, descoberta e presets.',
    ready: true,
  },
  {
    href: '/configuracoes/interacoes',
    label: 'Interações',
    icon: 'UserMultiple02Icon',
    description: 'Quem pode falar e interagir com você.',
    ready: true,
  },
  {
    href: '/configuracoes/notificacoes',
    label: 'Notificações',
    icon: 'Notification03Icon',
    description: 'O que você quer ser avisado.',
    ready: true,
  },
  {
    href: '/configuracoes/seguranca',
    label: 'Segurança',
    icon: 'Shield01Icon',
    description: 'Senha, 2FA e sessões.',
    ready: true,
  },
  {
    href: '/configuracoes/bloqueados',
    label: 'Bloqueados',
    icon: 'Cancel01Icon',
    description: 'Pessoas que você bloqueou.',
    ready: true,
  },
  {
    href: '/configuracoes/conteudo',
    label: 'Conteúdo e feed',
    icon: 'News01Icon',
    description: 'Palavras silenciadas e exibição.',
    ready: true,
  },
  {
    href: '/configuracoes/midia',
    label: 'Mídia',
    icon: 'Image01Icon',
    description: 'Privacidade padrão de fotos.',
    ready: true,
  },
  {
    href: '/configuracoes/dados',
    label: 'Seus dados',
    icon: 'File01Icon',
    description: 'Baixar dados e ver eventos da conta.',
    ready: true,
  },
  {
    href: '/configuracoes/conta-status',
    label: 'Status da conta',
    icon: 'Settings01Icon',
    description: 'Desativar ou excluir a conta.',
    ready: true,
  },
];
