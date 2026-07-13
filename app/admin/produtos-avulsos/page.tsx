import { redirect } from 'next/navigation';

export default function LegacyStandaloneProductsPage() {
  redirect('/admin/comercial/produtos?tipo=legado');
}
