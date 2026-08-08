import { redirect } from 'next/navigation';

// Rota legada preservada para os arquivos de publicidade sem contrato.
export default function AdminBannersPage() {
  redirect('/admin/publicidade-manual');
}
