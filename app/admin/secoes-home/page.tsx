import HomeSectionManager from '@/features/homeSections/HomeSectionManager';
import { listAdminHomeSections, listHomeSectionPostsForAdmin } from '@/features/homeSections/queries';

export const dynamic = 'force-dynamic';
export default async function AdminHomeSectionsPage() {
  const sections = await listAdminHomeSections();
  const entries = await Promise.all(sections.map(async (section) => [section.id, await listHomeSectionPostsForAdmin(section.id)] as const));
  return <div className="admin-page"><HomeSectionManager sections={sections} initialPosts={Object.fromEntries(entries)} /></div>;
}
