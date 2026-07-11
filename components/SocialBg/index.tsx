import type { ReactNode } from 'react';

// Fundo da área da Rede Social (perfis, comunidades, mensagens, notificações…).
// Usa a superfície #f8f9fa (token --color-section) preenchendo a área de conteúdo
// abaixo do header sticky (69px), para diferenciar a rede social do restante do portal.
export default function SocialBg({ children }: { children: ReactNode }) {
  return <div className="min-h-[calc(100vh-69px)] bg-section">{children}</div>;
}
