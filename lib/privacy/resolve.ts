// Camada de resolução de privacidade no frontend.
// ESPELHA a lógica do banco (0022: most_restrictive / effective_field_visibility /
// can_view_field). A autorização REAL é do banco (RLS + funções SECURITY DEFINER);
// isto serve para UI: rótulos, prévia "Ver como" e cálculo da visibilidade efetiva
// exibida ao usuário. Nunca substitui a checagem do servidor.
import type { ProfileVisibility } from '@/types/database';
import { fieldDefaultVisibility, type FieldKey } from './fields';

export const VISIBILITY_ORDER: Record<ProfileVisibility, number> = {
  publico: 0,
  amigos: 1,
  oculto: 2,
};

export const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  publico: 'Público',
  amigos: 'Só amigos',
  oculto: 'Só eu',
};

export const VISIBILITY_HINT: Record<ProfileVisibility, string> = {
  publico: 'Qualquer pessoa pode ver, inclusive visitantes não logados.',
  amigos: 'Somente você e seus amigos confirmados.',
  oculto: 'Somente você.',
};

export const VISIBILITY_ICON: Record<ProfileVisibility, string> = {
  publico: 'GlobalIcon',
  amigos: 'UserMultiple02Icon',
  oculto: 'SquareLock02Icon',
};

// Regra mais restritiva vence (publico < amigos < oculto).
export function mostRestrictive(a: ProfileVisibility, b: ProfileVisibility): ProfileVisibility {
  return VISIBILITY_ORDER[a] >= VISIBILITY_ORDER[b] ? a : b;
}

// Visibilidade efetiva de um campo: o valor do campo limitado pela
// visibilidade global do perfil.
export function effectiveFieldVisibility(
  fieldVisibility: ProfileVisibility,
  globalVisibility: ProfileVisibility,
): ProfileVisibility {
  return mostRestrictive(fieldVisibility, globalVisibility);
}

// A visibilidade selecionada foi rebaixada pelo perfil global?
export function isLimitedByGlobal(
  fieldVisibility: ProfileVisibility,
  globalVisibility: ProfileVisibility,
): boolean {
  return effectiveFieldVisibility(fieldVisibility, globalVisibility) !== fieldVisibility;
}

export type Audience = 'publico' | 'amigo' | 'dono';

// Prévia "Ver como": um público veria este campo? (espelha can_view_field para
// os casos não-bloqueados/não-admin — usado só para simulação visual).
export function audienceCanSeeField(
  audience: Audience,
  fieldVisibility: ProfileVisibility,
  globalVisibility: ProfileVisibility,
): boolean {
  if (audience === 'dono') return true;
  const eff = effectiveFieldVisibility(fieldVisibility, globalVisibility);
  if (eff === 'publico') return true;
  if (eff === 'amigos') return audience === 'amigo';
  return false; // oculto
}

// Resolve a visibilidade armazenada (ou padrão) de um campo.
export function resolveStoredVisibility(
  key: FieldKey,
  stored: ProfileVisibility | undefined | null,
): ProfileVisibility {
  return stored ?? fieldDefaultVisibility(key);
}
