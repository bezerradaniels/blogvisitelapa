// Fontes do tema "Jardim" via next/font (auto-hospedadas, sem requisição externa).
// Figtree atende toda a interface; Baloo 2 fica reservada ao wordmark da marca.
import { Baloo_2, Figtree } from 'next/font/google';

export const fontLogo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-logo',
  display: 'swap',
});

export const fontBody = Figtree({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});
