import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { titleCase } from '@/lib/utils/format';
import './admin.css';

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
    <div className="admin-shell min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-0 lg:h-screen">
        <AdminSidebar
          pendingComments={count ?? 0}
          openReports={reportsCount ?? 0}
          userName={titleCase(user.profile?.full_name) || 'Administrador'}
          userRole="Administrador"
        />
      </aside>

      <div className="min-w-0">
        <div className="flex h-9 items-center justify-end border-b border-[#c3c4c7] bg-[#1d2327] px-4">
          <Link href="/" className="text-xs text-white/85 hover:text-white hover:underline">
            Ver site →
          </Link>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
