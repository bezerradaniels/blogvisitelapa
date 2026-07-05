'use client';

// Oculta o cabeçalho/rodapé públicos nas rotas do painel admin,
// que possui seu próprio shell (sidebar). Mantém tudo no mesmo root layout.
import { usePathname } from 'next/navigation';

export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return <>{children}</>;
}
