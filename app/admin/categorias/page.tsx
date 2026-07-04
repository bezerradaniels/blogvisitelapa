import CategoryManager from '@/features/admin/CategoryManager';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Categorias</h2>
      <CategoryManager categories={data ?? []} />
    </div>
  );
}
