import ProductManager from '@/features/admin/ProductManager';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('standalone_products')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Produtos avulsos</h2>
      <ProductManager products={data ?? []} />
    </div>
  );
}
