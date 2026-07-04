import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function PublisherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.isPublisher) redirect('/');

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-headline text-lg font-extrabold text-title">Meu painel</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/publisher" className="text-body hover:text-brand">Posts</Link>
          <Link href="/publisher/rascunhos" className="text-body hover:text-brand">Rascunhos</Link>
          <Link href="/publisher/enviados" className="text-body hover:text-brand">Enviados</Link>
          <Link href="/publisher/posts/novo" className="font-medium text-brand">Novo post</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
