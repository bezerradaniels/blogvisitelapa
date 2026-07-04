// Fontes do projeto via next/font (auto-hospedadas, sem requisição externa).
//
// NOTA: "Stack Sans Headline/Text" é uma fonte comercial e NÃO está no Google Fonts.
// Usamos um par equivalente (Hanken Grotesk p/ títulos, Inter p/ corpo) exposto nas
// variáveis CSS --font-headline / --font-body. Para adotar a Stack Sans licenciada,
// declare os @font-face dela e sobrescreva essas duas variáveis em globals.css.
import { Hanken_Grotesk, Inter } from 'next/font/google';

export const fontHeadline = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-headline',
  display: 'swap',
});

export const fontBody = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
