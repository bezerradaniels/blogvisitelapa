'use client';

// Formulário de Perfil com privacidade POR CAMPO.
// Cada campo tem seu valor + um PrivacySelector (Público / Só amigos / Só eu).
// No topo, a visibilidade GERAL do perfil (limite máximo) e presets rápidos.
// Salvamento explícito com barra fixa e proteção contra saída sem salvar.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import PrivacySelector from '@/components/PrivacySelector';
import SettingsSection from '@/components/SettingsSection';
import Textarea from '@/components/Textarea';
import { saveProfileSettings } from '@/features/settings/actions';
import {
  FIELD_GROUP_LABELS,
  PROFILE_FIELDS,
  type FieldGroup,
  type FieldKey,
} from '@/lib/privacy/fields';
import { effectiveFieldVisibility } from '@/lib/privacy/resolve';
import type { ProfileSettingsData } from '@/features/settings/queries';
import type { ProfileVisibility } from '@/types/database';

interface Props {
  userId: string;
  initial: ProfileSettingsData;
}

// Campos de texto (o valor mora em `values`); imagens moram em estado à parte.
type TextFieldKey = Exclude<FieldKey, 'avatar_url' | 'cover_url'>;

const GLOBAL_HINT: Record<ProfileVisibility, string> = {
  publico: 'Seu perfil aparece para qualquer pessoa (respeitando o campo).',
  amigos: 'Só amigos veem o perfil — nenhum campo passa disso, mesmo os públicos.',
  oculto: 'Ninguém além de você vê o conteúdo do perfil.',
};

const PRESETS: { key: 'publico' | 'amigos' | 'privado'; label: string; value: ProfileVisibility }[] = [
  { key: 'publico', label: 'Perfil público', value: 'publico' },
  { key: 'amigos', label: 'Focado em amigos', value: 'amigos' },
  { key: 'privado', label: 'Perfil privado', value: 'oculto' },
];

export default function ProfilePrivacyForm({ userId, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({
    full_name: initial.full_name,
    nickname: initial.nickname,
    bio: initial.bio,
    about: initial.about,
    interests: initial.interests,
    city: initial.city,
    relationship: initial.relationship,
    birth_date: initial.birth_date,
    phone: initial.phone,
  });
  const [avatar, setAvatar] = useState<string | null>(initial.avatar_url);
  const [cover, setCover] = useState<string | null>(initial.cover_url);
  const [globalVis, setGlobalVis] = useState<ProfileVisibility>(initial.visibility);
  const [fieldVis, setFieldVis] = useState<Record<FieldKey, ProfileVisibility>>(initial.fieldVisibility);

  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }
  function setText(key: TextFieldKey, value: string) {
    setValues((p) => ({ ...p, [key]: value }));
    markDirty();
  }
  function setVisibility(key: FieldKey, v: ProfileVisibility) {
    setFieldVis((p) => ({ ...p, [key]: v }));
    markDirty();
  }
  function applyPreset(v: ProfileVisibility) {
    setFieldVis((prev) => {
      const next = { ...prev };
      for (const f of PROFILE_FIELDS) {
        next[f.key] = f.key === 'phone' && v === 'publico' ? 'amigos' : v;
      }
      return next;
    });
    markDirty();
  }

  // Proteção: avisa ao tentar sair com alterações não salvas.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Resumo ao vivo (visibilidade efetiva de cada campo).
  const summary = useMemo(() => {
    let publicCount = 0;
    let friends = 0;
    let priv = 0;
    for (const f of PROFILE_FIELDS) {
      const eff = effectiveFieldVisibility(fieldVis[f.key], globalVis);
      if (eff === 'publico') publicCount++;
      else if (eff === 'amigos') friends++;
      else priv++;
    }
    return { publicCount, friends, priv };
  }, [fieldVis, globalVis]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await saveProfileSettings({
      full_name: values.full_name,
      bio: values.bio,
      phone: values.phone,
      avatar_url: avatar ?? '',
      cover_url: cover ?? '',
      nickname: values.nickname,
      city: values.city,
      birth_date: values.birth_date,
      relationship: values.relationship,
      interests: values.interests,
      about: values.about,
      visibility: globalVis,
      fieldVisibility: fieldVis,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setDirty(false);
    setSaved(true);
    router.refresh();
  }

  const groups: FieldGroup[] = ['identidade', 'contato', 'localizacao', 'pessoal'];

  return (
    <form onSubmit={onSubmit} className="space-y-5 pb-24">
      {/* Visibilidade geral + presets */}
      <SettingsSection title="Visibilidade geral do perfil">
        <p className="mb-3 text-sm text-muted">
          Define o limite máximo de acesso. Um campo marcado como “Público” não passa
          desse limite se o perfil estiver como “Só amigos”.
        </p>
        <PrivacySelector
          name="global-visibility"
          legend="Visibilidade geral do perfil"
          value={globalVis}
          onChange={(v) => {
            setGlobalVis(v);
            markDirty();
          }}
        />
        <p className="mt-1 text-xs text-muted">{GLOBAL_HINT[globalVis]}</p>

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold text-body">Presets rápidos (revise antes de salvar):</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.value)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-bold text-body hover:border-brand hover:text-brand"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Campos por grupo */}
      {groups.map((group) => {
        const fields = PROFILE_FIELDS.filter((f) => f.group === group);
        if (fields.length === 0) return null;
        return (
          <SettingsSection key={group} title={FIELD_GROUP_LABELS[group]}>
            <div className="space-y-5">
              {fields.map((f) => (
                <div key={f.key} className="border-b border-line pb-5 last:border-0 last:pb-0">
                  {/* Controle de valor do campo */}
                  {f.key === 'avatar_url' ? (
                    <ImageUploader
                      bucket="user-avatars"
                      prefix={userId}
                      value={avatar}
                      onChange={(v) => {
                        setAvatar(v);
                        markDirty();
                      }}
                      label={f.label}
                      ratio="aspect-square"
                    />
                  ) : f.key === 'cover_url' ? (
                    <ImageUploader
                      bucket="user-avatars"
                      prefix={userId}
                      value={cover}
                      onChange={(v) => {
                        setCover(v);
                        markDirty();
                      }}
                      label={f.label}
                      ratio="aspect-[16/9]"
                    />
                  ) : f.key === 'about' ? (
                    <Textarea label={f.label} rows={3} value={values.about} onChange={(e) => setText('about', e.target.value)} />
                  ) : f.key === 'interests' ? (
                    <Textarea label={f.label} rows={2} value={values.interests} onChange={(e) => setText('interests', e.target.value)} />
                  ) : f.key === 'bio' ? (
                    <Textarea label={f.label} rows={2} maxLength={500} value={values.bio} onChange={(e) => setText('bio', e.target.value)} />
                  ) : f.key === 'birth_date' ? (
                    <Input label={f.label} type="date" value={values.birth_date} onChange={(e) => setText('birth_date', e.target.value)} />
                  ) : (
                    <Input
                      label={f.label}
                      value={values[f.key as TextFieldKey]}
                      onChange={(e) => setText(f.key as TextFieldKey, e.target.value)}
                    />
                  )}
                  {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}

                  {/* Controle de visibilidade do campo */}
                  <div className="mt-2">
                    <span className="mb-1 block text-xs font-semibold text-body">Quem pode ver:</span>
                    <PrivacySelector
                      name={`vis-${f.key}`}
                      legend={`Visibilidade de ${f.label}`}
                      value={fieldVis[f.key]}
                      onChange={(v) => setVisibility(f.key, v)}
                      globalVisibility={globalVis}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>
        );
      })}

      {/* Barra de salvamento fixa */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <div className="min-w-0 text-xs text-muted">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : saved ? (
              <span className="text-brand-dark">Perfil salvo.</span>
            ) : (
              <span className="hidden sm:inline">
                <Icon icon="GlobalIcon" size={13} className="mr-1 inline align-[-2px]" />
                {summary.publicCount} públicos · {summary.friends} só amigos · {summary.priv} só eu
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="hidden text-xs font-semibold text-warning sm:inline">
                Alterações não salvas
              </span>
            )}
            <Button variant="primary" disabled={loading || !dirty}>
              {loading ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
