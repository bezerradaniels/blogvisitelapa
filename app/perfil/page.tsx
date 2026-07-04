import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProfileForm from '@/features/profile/ProfileForm';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Meu perfil', path: '/perfil', noindex: true });

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/perfil');

  return (
    <div className="container-page max-w-xl py-8">
      <h1 className="text-2xl font-extrabold text-title">Meu perfil</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>

      <div className="mt-4 flex gap-3 text-sm">
        <Link href="/favoritos" className="text-brand underline">
          Meus favoritos
        </Link>
        {user.isPublisher && (
          <Link href="/publisher" className="text-brand underline">
            Painel do publisher
          </Link>
        )}
        {user.isAdmin && (
          <Link href="/admin" className="text-brand underline">
            Painel admin
          </Link>
        )}
      </div>

      <div className="card-base mt-6 p-5">
        {user.profile && (
          <ProfileForm
            profileId={user.profile.id}
            initialName={user.profile.full_name ?? ''}
            initialBio={user.profile.bio ?? ''}
            initialPhone={user.profile.phone ?? ''}
          />
        )}
      </div>
    </div>
  );
}
