export const homeSectionColors = [
  { value: 'transparent', label: 'Sem cor', className: 'bg-transparent', swatch: '#ffffff' },
  { value: 'slate-50', label: 'Cinza', className: 'bg-slate-50', swatch: '#f8fafc' },
  { value: 'red-50', label: 'Vermelho', className: 'bg-red-50', swatch: '#fef2f2' },
  { value: 'orange-50', label: 'Laranja', className: 'bg-orange-50', swatch: '#fff7ed' },
  { value: 'amber-50', label: 'Âmbar', className: 'bg-amber-50', swatch: '#fffbeb' },
  { value: 'yellow-50', label: 'Amarelo', className: 'bg-yellow-50', swatch: '#fefce8' },
  { value: 'lime-50', label: 'Lima', className: 'bg-lime-50', swatch: '#f7fee7' },
  { value: 'green-50', label: 'Verde', className: 'bg-green-50', swatch: '#f0fdf4' },
  { value: 'emerald-50', label: 'Esmeralda', className: 'bg-emerald-50', swatch: '#ecfdf5' },
  { value: 'cyan-50', label: 'Ciano', className: 'bg-cyan-50', swatch: '#ecfeff' },
  { value: 'sky-50', label: 'Azul-claro', className: 'bg-sky-50', swatch: '#f0f9ff' },
  { value: 'blue-50', label: 'Azul', className: 'bg-blue-50', swatch: '#eff6ff' },
  { value: 'indigo-50', label: 'Índigo', className: 'bg-indigo-50', swatch: '#eef2ff' },
  { value: 'violet-50', label: 'Violeta', className: 'bg-violet-50', swatch: '#f5f3ff' },
  { value: 'purple-50', label: 'Roxo', className: 'bg-purple-50', swatch: '#faf5ff' },
  { value: 'pink-50', label: 'Rosa', className: 'bg-pink-50', swatch: '#fdf2f8' },
  { value: 'rose-50', label: 'Rosé', className: 'bg-rose-50', swatch: '#fff1f2' },
] as const;

export type HomeSectionColor = (typeof homeSectionColors)[number]['value'];

export function homeSectionColorClass(value: HomeSectionColor) {
  return homeSectionColors.find((color) => color.value === value)?.className ?? 'bg-transparent';
}
