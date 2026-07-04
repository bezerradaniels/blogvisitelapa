import Link from 'next/link';

interface SectionTitleProps {
  title: string;
  href?: string;
  linkLabel?: string;
}

// Título de seção da home/listagens, com link opcional "ver mais".
export default function SectionTitle({ title, href, linkLabel = 'Ver tudo' }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
      <h2 className="text-base font-bold text-title md:text-lg">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-brand hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
