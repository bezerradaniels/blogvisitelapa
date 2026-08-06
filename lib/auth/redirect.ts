// Aceita apenas destinos internos absolutos. Evita que parâmetros de retorno
// levem o usuário para outro host depois da autenticação.
export function safeInternalRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
