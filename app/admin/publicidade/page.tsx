import { redirect } from 'next/navigation';

// Publicidade agora é uma visão operacional de campanhas vinculadas a contratos.
export default function LegacyAdvertisingPage() {
  redirect('/admin/comercial/campanhas');
}
