// Registro canônico dos campos de perfil com privacidade individual.
// ESTA LISTA É A FONTE ÚNICA no frontend; ela espelha o CHECK de field_key e
// os padrões de public.field_default_visibility() na migration 0022. Ao
// adicionar um campo, atualize os DOIS lugares (migration + este arquivo).
import type { ProfileVisibility } from '@/types/database';

export type FieldKey =
  | 'full_name'
  | 'nickname'
  | 'avatar_url'
  | 'cover_url'
  | 'bio'
  | 'about'
  | 'interests'
  | 'city'
  | 'relationship'
  | 'birth_date'
  | 'phone';

export type FieldGroup = 'identidade' | 'contato' | 'localizacao' | 'pessoal';

export interface FieldDef {
  key: FieldKey;
  label: string;
  /** Explicação curta mostrada perto do seletor de visibilidade. */
  hint?: string;
  group: FieldGroup;
  default: ProfileVisibility;
  /** Campos cuja visibilidade não pode ser afrouxada abaixo do padrão seguro. */
  minRestriction?: ProfileVisibility;
}

// Ordem = ordem de exibição dentro de cada grupo.
export const PROFILE_FIELDS: FieldDef[] = [
  { key: 'full_name', label: 'Nome completo', group: 'identidade', default: 'publico' },
  { key: 'nickname', label: 'Apelido', group: 'identidade', default: 'publico' },
  { key: 'avatar_url', label: 'Foto (avatar)', group: 'identidade', default: 'publico' },
  { key: 'cover_url', label: 'Capa do perfil', group: 'identidade', default: 'publico' },
  { key: 'bio', label: 'Bio curta', hint: 'Aparece junto às suas publicações.', group: 'identidade', default: 'publico' },

  {
    key: 'phone',
    label: 'Telefone',
    hint: 'Por segurança, o padrão é Só eu. Nunca é usado para login aqui.',
    group: 'contato',
    default: 'oculto',
  },

  { key: 'city', label: 'Cidade', group: 'localizacao', default: 'amigos' },

  { key: 'about', label: 'Quem sou eu', group: 'pessoal', default: 'amigos' },
  { key: 'interests', label: 'Interesses', group: 'pessoal', default: 'amigos' },
  { key: 'relationship', label: 'Relacionamento', group: 'pessoal', default: 'amigos' },
  { key: 'birth_date', label: 'Aniversário', group: 'pessoal', default: 'amigos' },
];

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  identidade: 'Identidade',
  contato: 'Contato',
  localizacao: 'Localização',
  pessoal: 'Informações pessoais',
};

const FIELD_BY_KEY = new Map(PROFILE_FIELDS.map((f) => [f.key, f]));

export function getFieldDef(key: FieldKey): FieldDef | undefined {
  return FIELD_BY_KEY.get(key);
}

export function fieldDefaultVisibility(key: FieldKey): ProfileVisibility {
  return FIELD_BY_KEY.get(key)?.default ?? 'amigos';
}

export function isFieldKey(key: string): key is FieldKey {
  return FIELD_BY_KEY.has(key as FieldKey);
}
