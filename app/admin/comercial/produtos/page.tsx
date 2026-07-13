import Link from 'next/link';
import ProductCatalogManager from '@/features/commercial/ProductCatalogManager';
import { adminGuard } from '@/lib/auth/adminGuard';

export const dynamic = 'force-dynamic';

export default async function CommercialProductsPage() {
  const ctx = await adminGuard();
  if (!ctx) return null;
  const [productsResult, placementsResult, legacyResult] = await Promise.all([
    ctx.supabase.from('commercial_products').select('*').order('is_active', { ascending: false }).order('name'),
    ctx.supabase.from('advertising_placements').select('*').order('name'),
    ctx.supabase.from('standalone_products').select('id, product_name, price, company_name, created_at').order('created_at', { ascending: false }).limit(20),
  ]);
  if (productsResult.error || placementsResult.error) {
    throw new Error('Não foi possível carregar catálogo e inventário comercial. Aplique a migração comercial antes de usar esta área.');
  }
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-extrabold text-title">Produtos e inventário</h1>
        <p className="mt-1 text-sm text-muted">Catálogo de serviços contratáveis e posições de publicidade disponíveis.</p>
      </header>
      <ProductCatalogManager products={productsResult.data ?? []} placements={placementsResult.data ?? []} />
      <section className="border-t border-line pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold text-title">Registros avulsos legados</h2><p className="text-sm text-muted">Preservados para consulta. Novas vendas devem ser itens de contrato.</p></div><Link href="/admin/produtos-avulsos" className="text-sm font-bold text-brand hover:underline">Abrir registros legados →</Link></div>
        {legacyResult.data?.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{legacyResult.data.map((product) => <li key={product.id} className="rounded-[12px] border border-line bg-card p-3"><strong className="block text-sm text-title">{product.product_name}</strong><span className="mt-1 block text-xs text-muted">{product.company_name ?? 'Sem cliente'} · {product.price == null ? 'Sem valor' : product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted">Nenhum registro avulso legado.</p>}
      </section>
    </div>
  );
}
