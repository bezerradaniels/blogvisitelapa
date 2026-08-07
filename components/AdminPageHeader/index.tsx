import Link from 'next/link';
import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}

export default function AdminPageHeader({ title, description, actionHref, actionLabel, children }: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="admin-page-title">{title}</h1>
        {actionHref && actionLabel ? <Link href={actionHref} className="admin-button admin-button-primary">{actionLabel}</Link> : null}
        {children}
      </div>
      {description ? <p className="admin-page-description">{description}</p> : null}
    </header>
  );
}
