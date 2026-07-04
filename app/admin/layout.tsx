import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { getCurrentUser } from '@/lib/auth/session';

// Layout do painel admin. Dupla proteção: middleware + checagem no servidor.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/');

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-headline text-lg font-extrabold text-title">Painel · Visite Lapa</h1>
        <Link href="/" className="text-sm text-brand hover:underline">
          Ver site
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="card-base h-fit p-2 lg:sticky lg:top-20">
          <AdminSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
