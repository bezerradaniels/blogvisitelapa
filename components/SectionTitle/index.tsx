import Link from 'next/link';

interface SectionTitleProps {
  title: string;
  href?: string;
  linkLabel?: string;
}

// Título de seção da home/listagens, com link opcional "ver mais".
export default function SectionTitle({ title, href, linkLabel = 'Ver tudo' }: SectionTitleProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-title md:text-2xl">
        <span className="leaf-pill" aria-hidden />
        {title}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-bold text-brand hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
