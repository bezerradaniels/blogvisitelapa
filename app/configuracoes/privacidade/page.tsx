import Link from 'next/link';
import Icon from '@/components/Icon';
import SettingsSection, { SettingsHeader } from '@/components/SettingsSection';
import DiscoveryForm from '@/features/settings/DiscoveryForm';
import PresetButtons from '@/features/settings/PresetButtons';
import { getPrivacyOverview, getPrivacyPrefs, getProfilePreviewAs } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { getFieldDef } from '@/lib/privacy/fields';
import { VISIBILITY_LABEL } from '@/lib/privacy/resolve';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/lib/utils/format';

export const metadata = buildMetadata({
  title: 'Privacidade',
  path: '/configuracoes/privacidade',
  noindex: true,
});

type Audience = 'publico' | 'amigos';
const PREVIEW_FIELDS = ['nickname', 'relationship', 'birth_date', 'city', 'interests', 'about'] as const;

interface Props {
  searchParams: Promise<{ como?: string }>;
}

export default async function PrivacidadePage({ searchParams }: Props) {
  const { como } = await searchParams;
  const audience: Audience = como === 'amigos' ? 'amigos' : 'publico';

  const user = await getCurrentUser();
  const profileId = user!.profile!.id;
  const [overview, prefs, preview] = await Promise.all([
    getPrivacyOverview(profileId),
    getPrivacyPrefs(profileId),
    getProfilePreviewAs(profileId, audience),
  ]);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Privacidade"
        description="Veja seu perfil como outras pessoas, ajuste a descoberta e use presets para configurar tudo de uma vez."
      />

      {/* Resumo */}
      <SettingsSection title="Resumo">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Públicos', value: overview.publicCount, tone: 'text-brand-dark' },
            { label: 'Só amigos', value: overview.friendsCount, tone: 'text-info' },
            { label: 'Só eu', value: overview.privateCount, tone: 'text-muted' },
          ].map((t) => (
            <div key={t.label} className="rounded-[10px] border border-line bg-surface p-3 text-center">
              <div className={`text-2xl font-extrabold ${t.tone}`}>{t.value}</div>
              <div className="text-xs font-semibold text-muted">{t.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Visibilidade geral do perfil: <strong>{VISIBILITY_LABEL[overview.globalVisibility]}</strong>.
          A regra mais restritiva vence.
        </p>
      </SettingsSection>

      {/* Ver como */}
      <SettingsSection title="Ver meu perfil como">
        <div
          role="tablist"
          aria-label="Audiência da prévia"
          className="mb-4 inline-flex rounded-full border border-line bg-surface p-0.5"
        >
          {(['publico', 'amigos'] as Audience[]).map((a) => {
            const active = audience === a;
            return (
              <Link
                key={a}
                href={`/configuracoes/privacidade?como=${a}`}
                role="tab"
                aria-selected={active}
                scroll={false}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors ${
                  active ? 'bg-brand text-white' : 'text-muted hover:text-brand'
                }`}
              >
                <Icon icon={a === 'publico' ? 'GlobalIcon' : 'UserMultiple02Icon'} size={15} />
                {a === 'publico' ? 'Visitante' : 'Amigo'}
              </Link>
            );
          })}
        </div>

        <p className="mb-3 text-xs text-muted">
          Simulação com as regras reais do servidor. É assim que{' '}
          {audience === 'publico' ? 'um visitante' : 'um amigo'} vê os campos do seu perfil.
        </p>

        <dl className="overflow-hidden rounded-[10px] border border-line">
          {PREVIEW_FIELDS.map((key) => {
            const label = getFieldDef(key)?.label ?? key;
            let value = preview[key];
            if (key === 'birth_date' && value) value = formatDate(value, "d 'de' MMMM");
            const hidden = value == null;
            return (
              <div
                key={key}
                className="grid gap-1 px-3 py-2.5 even:bg-surface sm:grid-cols-[140px_1fr] sm:gap-4"
              >
                <dt className="text-xs font-semibold text-muted sm:text-right">{label}</dt>
                <dd className="text-sm">
                  {hidden ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                      <Icon icon="SquareLock02Icon" size={13} />
                      Oculto para esse público
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap text-body">{value}</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-2 text-xs text-muted">
          Nome e foto formam sua identidade pública e sempre aparecem quando o perfil pode ser visto.
        </p>
      </SettingsSection>

      <DiscoveryForm
        initial={{
          allow_search_indexing: prefs.allow_search_indexing,
          search_visibility: prefs.search_visibility,
        }}
      />

      <SettingsSection title="Presets de privacidade">
        <PresetButtons />
      </SettingsSection>
    </div>
  );
}
