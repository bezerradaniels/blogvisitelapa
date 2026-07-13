import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import UserAdminActions from '@/features/admin/UserAdminActions';
import UserRowControl from '@/features/admin/UserRowControl';
import { getAdminUserDetails } from '@/features/admin/userDetails';
import { getCurrentUser } from '@/lib/auth/session';
import { formatDate, formatDateTime, titleCase } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

function display(value: string | null | undefined) {
  return value?.trim() || '—';
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;
  const [details, current] = await Promise.all([getAdminUserDetails(id), getCurrentUser()]);
  if (!details) notFound();

  const { profile, auth, social, usage, attention } = details;
  const fullName = titleCase(profile.fullName) || auth.email || 'Usuário sem nome';
  const isSelf = current?.profile?.id === profile.id;
  const metrics = [
    ['Posts', usage.posts],
    ['Visualizações nos posts', usage.postViews],
    ['Comentários', usage.comments],
    ['Avaliações', usage.ratings],
    ['Favoritos', usage.favorites],
    ['Amigos', usage.friends],
    ['Mensagens enviadas', usage.messages],
    ['Fotos', usage.photos],
    ['Comunidades', usage.communities],
  ] as const;

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/usuarios" className="text-sm font-semibold text-brand hover:underline">
          ← Voltar para usuários
        </Link>
        {profile.slug && (
          <Link
            href={`/u/${profile.slug}`}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Ir para o perfil →
          </Link>
        )}
      </nav>

      <header className="card-base space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-title">{fullName}</h2>
              {attention && <Badge tone="warning">Atenção interna</Badge>}
              <Badge tone={profile.status === 'active' ? 'success' : profile.status === 'suspended' ? 'danger' : 'warning'}>
                {profile.status === 'active' ? 'Ativo' : profile.status === 'suspended' ? 'Suspenso' : 'Pendente'}
              </Badge>
            </div>
            <p className="text-sm text-muted">Conta criada em {formatDate(profile.createdAt)}</p>
          </div>
          <UserRowControl
            profileId={profile.id}
            role={profile.role}
            status={profile.status}
            isSelf={isSelf}
          />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-base p-4 sm:p-5">
          <h3 className="mb-4 font-bold text-title">Informações e contatos</h3>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-muted">Nome</dt><dd className="mt-1 text-title">{display(titleCase(profile.fullName))}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Apelido</dt><dd className="mt-1 text-title">{display(social.nickname)}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">E-mail</dt><dd className="mt-1 break-all text-title">{display(auth.email)}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Telefone</dt><dd className="mt-1 text-title">{display(profile.phone ?? auth.phone)}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Cidade</dt><dd className="mt-1 text-title">{display(social.city)}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Nascimento</dt><dd className="mt-1 text-title">{social.birthDate ? formatDate(social.birthDate) : '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Perfil público</dt><dd className="mt-1 text-title">{profile.slug ? `/u/${profile.slug}` : '—'}</dd></div>
            <div><dt className="text-xs font-semibold text-muted">Login por</dt><dd className="mt-1 text-title">{auth.providers.join(', ') || 'E-mail'}</dd></div>
          </dl>
          {profile.bio && <p className="mt-4 border-t border-line pt-4 text-sm text-body">{profile.bio}</p>}
        </section>

        <section className="card-base p-4 sm:p-5">
          <h3 className="mb-4 font-bold text-title">Conta e acesso</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Cadastro</dt><dd className="text-right text-title">{formatDateTime(auth.createdAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">E-mail confirmado</dt><dd className="text-right text-title">{auth.confirmedAt ? formatDateTime(auth.confirmedAt) : 'Não'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Último login</dt><dd className="text-right text-title">{auth.lastSignInAt ? formatDateTime(auth.lastSignInAt) : 'Nunca'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Última atividade</dt><dd className="text-right text-title">{usage.lastActivityAt ? formatDateTime(usage.lastActivityAt) : 'Sem atividade'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Atualização do perfil</dt><dd className="text-right text-title">{formatDateTime(profile.updatedAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">ID da conta</dt><dd className="max-w-[65%] break-all text-right font-mono text-xs text-title">{profile.userId}</dd></div>
          </dl>
        </section>
      </div>

      <section>
        <h3 className="mb-3 font-bold text-title">Uso do aplicativo</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {metrics.map(([label, value]) => (
            <div key={label} className="card-base p-4">
              <p className="text-xs font-semibold text-muted">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-title">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <UserAdminActions
        profileId={profile.id}
        fullName={fullName}
        isSelf={isSelf}
        isSuspended={profile.status === 'suspended' || Boolean(auth.bannedUntil)}
        attention={attention}
      />
    </div>
  );
}
