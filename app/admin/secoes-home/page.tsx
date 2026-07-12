import HomeSectionManager from '@/features/homeSections/HomeSectionManager';
import { listAdminHomeSections, listHomeSectionPostsForAdmin } from '@/features/homeSections/queries';

export const dynamic = 'force-dynamic';
export default async function AdminHomeSectionsPage() {
  const sections = await listAdminHomeSections();
  const entries = await Promise.all(sections.map(async (section) => [section.id, await listHomeSectionPostsForAdmin(section.id)] as const));
  return <div className="space-y-4"><div><h1 className="text-xl font-extrabold text-title">Seções da homepage</h1><p className="text-sm text-muted">Crie coleções editoriais e escolha onde elas aparecem na home.</p></div><HomeSectionManager sections={sections} initialPosts={Object.fromEntries(entries)} /></div>;
}
