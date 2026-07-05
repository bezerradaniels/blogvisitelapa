import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'bg-title text-white hover:opacity-90',
  accent: 'bg-accent text-accent-ink hover:brightness-95',
  outline: 'border border-line bg-card text-body hover:bg-surface',
  ghost: 'text-body hover:bg-surface',
  danger: 'bg-danger text-white hover:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-4 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-11 px-6 text-sm',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & { href: string };

// Botão que também funciona como link (quando `href` é passado).
export default function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
