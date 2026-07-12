import Link from 'next/link';
import Icon from '@/components/Icon';
import { SettingsHeader } from '@/components/SettingsSection';
import { getPrivacyOverview } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { SETTINGS_NAV } from '@/lib/settings/nav';
import { VISIBILITY_LABEL } from '@/lib/privacy/resolve';

export const metadata = buildMetadata({
  title: 'Configurações',
  path: '/configuracoes',
  noindex: true,
});

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-3 text-center">
      <div className={`text-2xl font-extrabold ${tone}`}>{value}</div>
      <div className="text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  const profileId = user!.profile!.id;
  const slug = user!.profile!.slug;
  const overview = await getPrivacyOverview(profileId);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Configurações"
        description="Central de conta, privacidade e segurança. Você controla quem vê cada informação do seu perfil."
      />

      {/* Resumo de privacidade */}
      <section className="card-base p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-title">Resumo da privacidade</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">
            <Icon icon="SquareLock02Icon" size={14} />
            Perfil: {VISIBILITY_LABEL[overview.globalVisibility]}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <SummaryTile label="Públicos" value={overview.publicCount} tone="text-brand-dark" />
          <SummaryTile label="Só amigos" value={overview.friendsCount} tone="text-info" />
          <SummaryTile label="Só eu" value={overview.privateCount} tone="text-muted" />
        </div>
        <p className="mt-3 text-xs text-muted">
          Contagem entre {overview.total} campos do perfil, já considerando o limite da
          visibilidade geral (a regra mais restritiva vence).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/configuracoes/perfil"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Ajustar privacidade
          </Link>
          {slug && (
            <Link
              href={`/u/${slug}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-bold text-brand hover:bg-surface"
            >
              Ver meu perfil público
            </Link>
          )}
        </div>
      </section>

      {/* Seções */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_NAV.map((item) =>
          item.ready ? (
            <Link
              key={item.href}
              href={item.href}
              className="card-hover card-base flex items-start gap-3 p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
                <Icon icon={item.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-title">{item.label}</span>
                <span className="block text-xs text-muted">{item.description}</span>
              </span>
            </Link>
          ) : (
            <div
              key={item.href}
              aria-disabled="true"
              className="card-base flex items-start gap-3 p-4 opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                <Icon icon={item.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-extrabold text-title">
                  {item.label}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                    em breve
                  </span>
                </span>
                <span className="block text-xs text-muted">{item.description}</span>
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
