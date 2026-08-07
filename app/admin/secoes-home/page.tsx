import HomeSectionManager from '@/features/homeSections/HomeSectionManager';
import AdminPageHeader from '@/components/AdminPageHeader';
import { listAdminHomeSections, listHomeSectionPostsForAdmin } from '@/features/homeSections/queries';

export const dynamic = 'force-dynamic';
export default async function AdminHomeSectionsPage() {
  const sections = await listAdminHomeSections();
  const entries = await Promise.all(sections.map(async (section) => [section.id, await listHomeSectionPostsForAdmin(section.id)] as const));
  return <div className="admin-page space-y-4"><AdminPageHeader title="Seções da página inicial" description="Crie coleções editoriais e escolha onde elas aparecem na página inicial." /><HomeSectionManager sections={sections} initialPosts={Object.fromEntries(entries)} /></div>;
}
