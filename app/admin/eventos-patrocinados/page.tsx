import { redirect } from 'next/navigation';

export default function LegacySponsoredEventsPage() {
  redirect('/admin/comercial/conteudo?tipo=evento');
}
