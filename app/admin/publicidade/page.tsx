import Image from 'next/image';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

// Visão dos anúncios ativos agora (status ativo, no período, com banner).
export default async function AdminPublicidadePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('ad_contracts')
    .select('id, title, placement, banner_url, company_name, start_date, end_date, priority')
    .eq('status', 'ativo')
    .lte('start_date', today)
    .gte('end_date', today)
    .not('banner_url', 'is', null)
    .order('placement');
  const ads = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-title">Anúncios ativos agora</h2>
        <Button href="/admin/contratos" size="sm" variant="outline">Gerenciar contratos</Button>
      </div>
      <p className="text-xs text-muted">
        Estes são os criativos que estão sendo exibidos no site neste momento.
      </p>

      {ads.length === 0 ? (
        <EmptyState
          title="Nenhum anúncio ativo"
          description="Crie e ative um contrato para exibir banners no site."
          action={<Button href="/admin/contratos/novo">Novo contrato</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <div key={ad.id} className="card-base overflow-hidden">
              {ad.banner_url && (
                <div className="relative aspect-[16/6] bg-surface">
                  <Image src={ad.banner_url} alt={ad.title} fill sizes="300px" className="object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-title">{ad.title}</p>
                <p className="text-xs text-muted">{ad.placement} · {ad.company_name ?? '—'}</p>
                <p className="text-xs text-muted">até {formatDate(ad.end_date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
