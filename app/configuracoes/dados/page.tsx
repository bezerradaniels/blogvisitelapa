import SettingsSection, { SettingsHeader } from '@/components/SettingsSection';
import DataExportButton from '@/features/settings/DataExportButton';
import { getMySecurityEvents } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/lib/utils/format';

export const metadata = buildMetadata({ title: 'Seus dados', path: '/configuracoes/dados', noindex: true });

// Rótulos amigáveis para os eventos registrados na trilha de auditoria.
const ACTION_LABELS: Record<string, string> = {
  'account.data_exported': 'Exportação de dados',
  'account.deactivated': 'Conta desativada',
  'account.reactivated': 'Conta reativada',
  'account.deletion_requested': 'Exclusão solicitada',
  'account.deletion_canceled': 'Exclusão cancelada',
};

export default async function DadosPage() {
  const user = await getCurrentUser();
  const events = await getMySecurityEvents(user!.profile!.id);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Seus dados"
        description="Baixe uma cópia dos seus dados e acompanhe eventos recentes da conta."
      />

      <SettingsSection
        title="Baixar meus dados"
        description="Um arquivo JSON com seu perfil, configurações, publicações, amizades, comunidades, fotos e bloqueios."
      >
        <DataExportButton />
      </SettingsSection>

      <SettingsSection title="Eventos recentes da conta">
        {events.length === 0 ? (
          <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-line rounded-[10px] border border-line">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-sm font-semibold text-title">
                  {ACTION_LABELS[e.action] ?? e.action}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {formatDate(e.createdAt, "d MMM yyyy 'às' HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </div>
  );
}
