import { redirect } from 'next/navigation';

// Banners são gerenciados como contratos de publicidade (com criativo/banner).
export default function AdminBannersPage() {
  redirect('/admin/contratos');
}
