// Wordmark único da marca, reutilizado nos pontos de navegação do site.
import { cn } from '@/lib/utils/cn';

interface BrandLogoProps {
  /** Use em fundos escuros, como o rodapé e o painel administrativo. */
  inverted?: boolean;
  className?: string;
}

export default function BrandLogo({ inverted = false, className }: BrandLogoProps) {
  return (
    <span
      className={cn(
        'font-headline text-xl font-extrabold',
        inverted ? 'text-white' : 'text-title',
        className,
      )}
    >
      Conecta<span className="text-mint2">Lapa</span>
    </span>
  );
}
