import { redirect } from 'next/navigation';

export default function LegacyAdvertorialsPage() {
  redirect('/admin/comercial/conteudo?tipo=artigo');
}
