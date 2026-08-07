import CategoryManager from '@/features/admin/CategoryManager';
import AdminPageHeader from '@/components/AdminPageHeader';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Categorias" description="Organize a classificação editorial e os itens de navegação do portal." />
      <CategoryManager categories={data ?? []} />
    </div>
  );
}
