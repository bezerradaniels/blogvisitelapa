import './globals.css';

export const metadata = {
  title: 'Visite Lapa',
  description: 'Descubra a Lapa: boemia, arte, música e história no coração do Rio de Janeiro.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
