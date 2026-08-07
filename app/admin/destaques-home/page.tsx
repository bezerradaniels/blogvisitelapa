import AdminPageHeader from '@/components/AdminPageHeader';
import HomeEditorialManager from '@/features/homeEditorial/HomeEditorialManager';
import { getManualHomeEditorialPosts, listHomeEditorialCandidates } from '@/features/homeEditorial/queries';
import { homeEditorialAreas, type HomeEditorialAreaKey } from '@/lib/config/homeEditorial';

export const dynamic = 'force-dynamic';

export default async function AdminHomeEditorialPage() {
  const [manual, candidates] = await Promise.all([getManualHomeEditorialPosts(), listHomeEditorialCandidates()]);
  const initial = Object.fromEntries(homeEditorialAreas.map((area) => [area.key, manual[area.key].map((post) => post.id)])) as Record<HomeEditorialAreaKey, string[]>;
  return <div className="admin-page space-y-4"><AdminPageHeader title="Destaques da home" description="Escolha manualmente os 16 artigos das três principais áreas. Posições vazias são preenchidas com artigos recentes." /><HomeEditorialManager candidates={candidates} initial={initial} /></div>;
}
