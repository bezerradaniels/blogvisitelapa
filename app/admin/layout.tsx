import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { titleCase } from '@/lib/utils/format';

// Layout do painel admin (shell próprio, sem header/rodapé públicos).
// Dupla proteção: middleware + checagem no servidor.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/');

  const supabase = await createClient();
  const [{ count }, { count: reportsCount }] = await Promise.all([
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    supabase.from('community_reports').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
  ]);

  return (
    <div
      // Painel usa o verde novo (#4de191) como cor de marca, sem afetar o site público.
      style={{ '--color-brand': '#4de191' } as React.CSSProperties}
      className="min-h-screen bg-base lg:grid lg:grid-cols-[250px_1fr]"
    >
      <aside className="lg:sticky lg:top-0 lg:h-screen">
        <AdminSidebar
          pendingComments={count ?? 0}
          openReports={reportsCount ?? 0}
          userName={titleCase(user.profile?.full_name) || 'Administrador'}
          userRole="Administrador"
        />
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-end border-b border-line bg-card px-4 py-3">
          <Link href="/" className="text-sm font-bold text-brand hover:underline">
            Ver site →
          </Link>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
