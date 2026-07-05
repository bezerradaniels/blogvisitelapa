import type { Config } from 'tailwindcss';

// Design system do Visite Lapa.
// As cores, fontes, raios e espaçamentos apontam para variáveis CSS definidas em
// app/globals.css — assim o tema é ajustável em um único lugar (inclusive para
// trocar a fonte por "Stack Sans" licenciada no futuro).
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fundos e superfícies
        base: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        // Texto
        title: 'var(--color-title)',
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        // Marca e estados
        brand: {
          DEFAULT: 'var(--color-brand)',
          dark: 'var(--color-brand-dark)',
          soft: 'var(--color-brand-soft)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          ink: 'var(--color-accent-ink)',
        },
        highlight: {
          DEFAULT: 'var(--color-highlight)',
          ink: 'var(--color-highlight-ink)',
        },
        mint2: 'var(--color-mint-2)',
        line: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        headline: 'var(--font-headline)',
        body: 'var(--font-body)',
      },
      fontSize: {
        // Escala mobile-first (o desktop aumenta via utilitários md:).
        'title-mobile': ['0.875rem', { lineHeight: '1.3', fontWeight: '700' }],
        'title-desktop': ['1.125rem', { lineHeight: '1.35', fontWeight: '700' }],
        'body-mobile': ['0.75rem', { lineHeight: '1.6' }],
        'body-desktop': ['0.875rem', { lineHeight: '1.65' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};

export default config;
