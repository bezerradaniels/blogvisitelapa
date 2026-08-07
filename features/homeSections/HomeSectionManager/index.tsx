'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import ToggleSwitch from '@/components/ToggleSwitch';
import { deleteHomeSection, duplicateHomeSection, saveHomeSection, searchEligibleSectionPosts } from '@/features/homeSections/actions';
import { homeSectionColors, type HomeSectionColor } from '@/lib/config/homeSectionColors';
import { slugify } from '@/lib/utils/format';
import type { HomeSection } from '@/types/homeSections';

type SearchPost = { id: string; title: string; slug: string; published_at: string | null; cover_image_url: string | null; category: { name: string } | null; author: { full_name: string | null } | null };
type Form = { id?: string; title: string; subtitle: string; description: string; slug: string; status: 'active' | 'inactive'; display_order: number; placement_zone: 'after-hero' | 'after-latest-news' | 'before-events' | 'before-footer'; show_view_all: boolean; view_all_mode: 'internal' | 'custom' | 'hidden'; custom_view_all_url: string; cover_image_url: string; cover_image_alt: string; background_color: HomeSectionColor; post_ids: string[] };

const empty = (): Form => ({ title: '', subtitle: '', description: '', slug: '', status: 'inactive', display_order: 0, placement_zone: 'after-latest-news', show_view_all: true, view_all_mode: 'internal', custom_view_all_url: '', cover_image_url: '', cover_image_alt: '', background_color: 'transparent', post_ids: [] });
const fromSection = (s: HomeSection, ids: string[] = []): Form => ({ id: s.id, title: s.title, subtitle: s.subtitle ?? '', description: s.description ?? '', slug: s.slug, status: s.status, display_order: s.display_order, placement_zone: s.placement_zone, show_view_all: s.show_view_all, view_all_mode: s.view_all_mode, custom_view_all_url: s.custom_view_all_url ?? '', cover_image_url: s.cover_image_url ?? '', cover_image_alt: s.cover_image_alt ?? '', background_color: s.background_color ?? 'transparent', post_ids: ids });

export default function HomeSectionManager({ sections, initialPosts }: { sections: HomeSection[]; initialPosts: Record<string, SearchPost[]> }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(empty);
  const [editorOpen, setEditorOpen] = useState(false);
  const [results, setResults] = useState<SearchPost[]>([]);
  const [term, setTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const selected = form.post_ids.map((id) => [...Object.values(initialPosts).flat(), ...results].find((post) => post.id === id) ?? { id, title: 'Post selecionado', slug: '', published_at: null, cover_image_url: null, category: null, author: null });

  useEffect(() => {
    if (!editorOpen) return;
    const timer = window.setTimeout(() => start(async () => { const r = await searchEligibleSectionPosts(term); if (r.ok) setResults(r.posts as unknown as SearchPost[]); }), 350);
    return () => window.clearTimeout(timer);
  }, [editorOpen, term]);

  function patch(values: Partial<Form>) { setForm((current) => ({ ...current, ...values })); }
  function choose(post: SearchPost) { if (!form.post_ids.includes(post.id)) patch({ post_ids: [...form.post_ids, post.id] }); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= form.post_ids.length) return; const ids = [...form.post_ids]; const current = ids[index]; const next = ids[target]; if (!current || !next) return; ids[index] = next; ids[target] = current; patch({ post_ids: ids }); }
  function createNew() { setForm(empty()); setError(null); setTerm(''); setEditorOpen(true); }
  function edit(section: HomeSection) { setForm(fromSection(section, initialPosts[section.id]?.map((post) => post.id) ?? [])); setError(null); setTerm(''); setEditorOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function closeEditor() { setEditorOpen(false); setForm(empty()); setError(null); }
  function save() { setError(null); start(async () => { const r = await saveHomeSection({ ...form, selection_mode: 'manual' }); if (!r.ok) return setError(r.error ?? 'Erro ao salvar.'); closeEditor(); router.refresh(); }); }
  function remove(id: string, title: string) { if (!window.confirm(`Excluir “${title}”? Os posts originais não serão excluídos.`)) return; start(async () => { const r = await deleteHomeSection(id); if (!r.ok) setError(r.error ?? 'Erro ao excluir.'); else router.refresh(); }); }

  return <div className="space-y-4">
    <header className="admin-page-header">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="admin-page-title">Seções da página inicial</h1>
        <button type="button" onClick={createNew} className="admin-button admin-button-primary">Nova seção</button>
      </div>
      <p className="admin-page-description">Crie coleções editoriais e escolha onde elas aparecem na página inicial.</p>
    </header>

    {editorOpen && <section className="card-base space-y-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-title">{form.id ? `Editar: ${form.title}` : 'Nova seção'}</h2><p className="text-xs text-muted">Salve incompleta como inativa; para ativar, inclua posts públicos.</p></div><button type="button" onClick={closeEditor} className="admin-button">Fechar</button></div>
      <div className="grid gap-3 sm:grid-cols-2"><Input label="Título" value={form.title} onChange={(e) => patch({ title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} /><Input label="Slug" value={form.slug} onChange={(e) => patch({ slug: slugify(e.target.value) })} /><Input label="Subtítulo" value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} /><Input label="Ordem" type="number" value={String(form.display_order)} onChange={(e) => patch({ display_order: Number(e.target.value) })} /><Select label="Posição na home" value={form.placement_zone} onChange={(e) => patch({ placement_zone: e.target.value as Form['placement_zone'] })} options={[{ value: 'after-hero', label: 'Após o destaque' }, { value: 'after-latest-news', label: 'Após últimos artigos' }, { value: 'before-events', label: 'Antes dos eventos' }, { value: 'before-footer', label: 'Antes do rodapé' }]} /><Select label="Status" value={form.status} onChange={(e) => patch({ status: e.target.value as Form['status'] })} options={[{ value: 'inactive', label: 'Inativa' }, { value: 'active', label: 'Ativa' }]} /></div>
      <fieldset><legend className="mb-2 text-sm font-semibold text-title">Cor de fundo da seção</legend><div className="flex flex-wrap gap-2">{homeSectionColors.map((color) => <label key={color.value} className={`flex cursor-pointer items-center gap-2 border px-2.5 py-2 text-xs ${form.background_color === color.value ? 'border-brand ring-1 ring-brand' : 'border-line'}`}><input type="radio" name="background_color" value={color.value} checked={form.background_color === color.value} onChange={() => patch({ background_color: color.value })} className="sr-only" /><span className="h-5 w-5 border border-line" style={{ backgroundColor: color.swatch }} aria-hidden />{color.label}</label>)}</div><p className="mt-2 text-xs text-muted">Tons claros da escala 50, pensados para manter a leitura confortável.</p></fieldset>
      <Textarea label="Descrição (na página pública)" rows={3} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2"><ImageUploader bucket="section-covers" prefix="home" value={form.cover_image_url || null} onChange={(url) => patch({ cover_image_url: url ?? '' })} label="Imagem de capa" compact /><Input label="Texto alternativo da capa" value={form.cover_image_alt} onChange={(e) => patch({ cover_image_alt: e.target.value })} /></div>
      <ToggleSwitch label="Exibir link “Ver tudo”" checked={form.show_view_all} onChange={(show_view_all) => patch({ show_view_all })} />
      {form.show_view_all && <div className="grid gap-3 sm:grid-cols-2"><Select label="Destino do link" value={form.view_all_mode} onChange={(e) => patch({ view_all_mode: e.target.value as Form['view_all_mode'] })} options={[{ value: 'internal', label: 'Página da seção' }, { value: 'custom', label: 'URL personalizada' }, { value: 'hidden', label: 'Ocultar' }]} />{form.view_all_mode === 'custom' && <Input label="URL" value={form.custom_view_all_url} onChange={(e) => patch({ custom_view_all_url: e.target.value })} />}</div>}
      <div className="border-t border-line pt-4"><label className="block text-sm font-semibold text-title">Selecionar posts publicados</label><Input aria-label="Buscar posts" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar pelo título" /><div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-line">{results.map((post) => <button key={post.id} type="button" onClick={() => choose(post)} disabled={form.post_ids.includes(post.id)} className="flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2 text-left text-sm hover:bg-surface disabled:opacity-50"><span className="truncate font-medium text-title">{post.title}<span className="ml-2 text-xs text-muted">{post.category?.name}</span></span><span>{form.post_ids.includes(post.id) ? 'Selecionado' : 'Adicionar'}</span></button>)}{!pending && results.length === 0 && <p className="p-3 text-sm text-muted">Nenhum post encontrado.</p>}</div></div>
      <div><h3 className="text-sm font-semibold text-title">Posts selecionados ({selected.length})</h3><ol className="mt-2 divide-y divide-line rounded-lg border border-line">{selected.map((post, index) => <li key={post.id} className="flex items-center gap-2 p-2"><span className="w-5 text-xs text-muted">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-title">{post.title}</span><button type="button" onClick={() => move(index, -1)} disabled={!index} className="rounded border border-line px-2 py-1 text-xs disabled:opacity-40" aria-label={`Mover ${post.title} para cima`}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1} className="rounded border border-line px-2 py-1 text-xs disabled:opacity-40" aria-label={`Mover ${post.title} para baixo`}>↓</button><button type="button" onClick={() => patch({ post_ids: form.post_ids.filter((id) => id !== post.id) })} className="text-xs text-danger">Remover</button></li>)}{selected.length === 0 && <li className="p-3 text-sm text-muted">Nenhum post selecionado.</li>}</ol></div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}<div className="flex flex-wrap gap-2"><Button onClick={save}>{pending ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar seção'}</Button><Button variant="ghost" onClick={closeEditor}>Cancelar</Button></div>
    </section>}

    <section className="space-y-2" aria-label="Seções personalizadas">{sections.map((section) => <details key={section.id} className="admin-management-surface group">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none"><span className="text-xs transition-transform group-open:rotate-90" aria-hidden>▶</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-title">{section.title}</strong><span className="text-xs text-muted">{section.status === 'active' ? 'Ativa' : 'Inativa'} · {initialPosts[section.id]?.length ?? 0} posts · {section.placement_zone}</span></span><span className="h-5 w-5 border border-line" style={{ backgroundColor: homeSectionColors.find((color) => color.value === section.background_color)?.swatch ?? '#fff' }} aria-label="Cor de fundo selecionada" /></summary>
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 text-xs"><span className="mr-auto text-muted">/secoes/{section.slug} · ordem {section.display_order}</span><button onClick={() => edit(section)} className="text-brand">Editar</button><button onClick={() => start(async () => { await duplicateHomeSection(section.id); router.refresh(); })} className="text-brand">Duplicar</button>{section.status === 'active' && <a href={`/secoes/${section.slug}`} target="_blank" className="text-brand">Ver</a>}<button onClick={() => remove(section.id, section.title)} className="text-danger">Excluir</button></div>
    </details>)}{sections.length === 0 && <div className="admin-management-surface p-5 text-center text-sm text-muted">Nenhuma seção criada.</div>}</section>
  </div>;
}
