import { redirect } from 'next/navigation';
import CommunityForm from '@/features/communities/CommunityForm';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Criar comunidade', path: '/comunidades/nova', noindex: true });

export default async function NovaComunidadePage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login?redirect=/comunidades/nova');

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="mb-1 text-2xl font-extrabold text-title">Criar comunidade</h1>
      <p className="mb-6 text-sm text-muted">
        Sua comunidade fica pública imediatamente. Você será o dono e poderá moderar os tópicos.
      </p>
      <CommunityForm userId={user.userId} />
    </div>
  );
}
