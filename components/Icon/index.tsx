// Wrapper fino sobre o Hugeicons.
// Aceita tanto o objeto do ícone quanto o nome (string) registrado em lib/icons.
import { HugeiconsIcon } from '@hugeicons/react';
import { resolveIcon, type IconData } from '@/lib/icons';

interface IconProps {
  icon: IconData | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  'aria-label'?: string;
}

export default function Icon({
  icon,
  size = 20,
  className,
  strokeWidth = 1.8,
  'aria-label': ariaLabel,
}: IconProps) {
  const resolved = typeof icon === 'string' ? resolveIcon(icon) : icon;
  return (
    <HugeiconsIcon
      icon={resolved}
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    />
  );
}
