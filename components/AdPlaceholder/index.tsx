interface AdPlaceholderProps {
  code: string;
  name: string;
  dimensions: string;
  mobileDimensions?: string;
  ratio?: string;
  className?: string;
}

export default function AdPlaceholder({ code, name, dimensions, mobileDimensions, ratio = 'aspect-[16/5]', className }: AdPlaceholderProps) {
  return <div className={className} data-ad-placeholder={code}>
    <div className={`flex w-full ${ratio} flex-col items-center justify-center border border-dashed border-brand/35 bg-brand-soft/25 px-4 text-center`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark">Espaço publicitário</span>
      <strong className="mt-1 text-sm text-title">{name}</strong>
      <span className="mt-1 font-mono text-[11px] text-muted">
        {code} · <span className={mobileDimensions ? 'hidden sm:inline' : undefined}>{dimensions}</span>
        {mobileDimensions && <span className="sm:hidden">{mobileDimensions}</span>}
      </span>
    </div>
  </div>;
}
