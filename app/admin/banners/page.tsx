import { redirect } from 'next/navigation';

// Banners são campanhas vinculadas a itens de contrato.
export default function AdminBannersPage() {
  redirect('/admin/comercial/campanhas');
}
