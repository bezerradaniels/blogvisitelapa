// Fontes do tema "Jardim" via next/font (auto-hospedadas, sem requisição externa).
// Baloo 2 (títulos, arredondada e "bold") + Nunito (corpo). Ambas gratuitas no
// Google Fonts. Propagadas pelas variáveis --font-headline / --font-body — nenhum
// componente precisa referenciar a fonte diretamente.
import { Baloo_2, Nunito } from 'next/font/google';

export const fontHeadline = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-headline',
  display: 'swap',
});

export const fontBody = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});
