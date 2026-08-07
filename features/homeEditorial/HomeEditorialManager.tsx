'use client';

import { useId, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { homeEditorialAreas, type HomeEditorialAreaKey } from '@/lib/config/homeEditorial';
import { saveHomeEditorialSlots } from './actions';

interface Candidate { id: string; title: string; }

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export default function HomeEditorialManager({ candidates, initial }: { candidates: Candidate[]; initial: Record<HomeEditorialAreaKey, string[]> }) {
  const [slots, setSlots] = useState(initial);
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();

  function select(areaKey: HomeEditorialAreaKey, index: number, postId: string) {
    setSlots((current) => {
      const next = Object.fromEntries(homeEditorialAreas.map((area) => [area.key, [...current[area.key]]])) as Record<HomeEditorialAreaKey, string[]>;
      for (const area of homeEditorialAreas) next[area.key] = next[area.key].filter((id) => id !== postId);
      if (!postId) { next[areaKey].splice(index, 1); return next; }
      next[areaKey].splice(index, 0, postId);
      const limit = homeEditorialAreas.find((area) => area.key === areaKey)?.limit ?? 0;
      next[areaKey] = next[areaKey].slice(0, limit);
      return next;
    });
  }

  return <div className="space-y-5">
    {homeEditorialAreas.map((area) => <section key={area.key} className="admin-table-wrap p-4">
      <div className="mb-3"><h2 className="admin-section-title">{area.title}</h2><p className="text-xs text-[#646970]">{area.limit} posições · o conteúdo atual desce ao inserir um novo artigo.</p></div>
      <div className="divide-y divide-[#dcdcde] border border-[#dcdcde]">
        {area.labels.map((label, index) => <div key={label} className="grid gap-2 bg-white px-3 py-3 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
          <span className="text-sm font-semibold text-[#1d2327]">{index + 1}. {label}</span>
          <SearchableArticleSelect key={slots[area.key][index] ?? 'automatic'} candidates={candidates} value={slots[area.key][index] ?? ''} onChange={(postId) => select(area.key, index, postId)} />
        </div>)}
      </div>
    </section>)}
    <div className="flex items-center gap-3"><button type="button" className="admin-button admin-button-primary" disabled={pending} onClick={() => start(async () => { const result = await saveHomeEditorialSlots(slots); setMessage(result.ok ? 'Posições salvas.' : result.error ?? 'Erro ao salvar.'); if (result.ok) router.refresh(); })}>{pending ? 'Salvando…' : 'Salvar posições'}</button>{message && <p className="text-sm text-[#50575e]">{message}</p>}</div>
  </div>;
}

function SearchableArticleSelect({ candidates, value, onChange }: { candidates: Candidate[]; value: string; onChange: (postId: string) => void }) {
  const selected = candidates.find((post) => post.id === value);
  const [query, setQuery] = useState(selected?.title ?? '');
  const [open, setOpen] = useState(false);
  const listId = useId();

  const results = useMemo(() => {
    const normalized = normalizeSearch(query);
    return candidates.filter((post) => !normalized || normalizeSearch(post.title).includes(normalized)).slice(0, 10);
  }, [candidates, query]);

  return <div className="relative min-w-0">
    <div className="flex gap-1.5">
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className="admin-control min-w-0 flex-1"
        placeholder="Digite para buscar um artigo…"
        value={query}
        onFocus={() => { setOpen(true); if (selected) setQuery(''); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onBlur={() => { window.setTimeout(() => { setOpen(false); setQuery(selected?.title ?? ''); }, 120); }}
      />
      {value ? <button type="button" className="admin-button shrink-0" onClick={() => { onChange(''); setQuery(''); }} aria-label="Usar preenchimento automático">Automático</button> : null}
    </div>
    {!value && !open ? <span className="mt-1 block text-xs font-normal text-[#646970]">Preenchimento automático</span> : null}
    {open && <div id={listId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border border-[#8c8f94] bg-white shadow-lg">
      <button type="button" role="option" aria-selected={!value} className="block w-full border-b border-[#dcdcde] px-3 py-2 text-left text-sm hover:bg-[#f0f6fc]" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(''); setQuery(''); setOpen(false); }}>Preenchimento automático</button>
      {results.map((post) => <button key={post.id} type="button" role="option" aria-selected={post.id === value} className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f0f6fc] aria-selected:bg-[#e5f3ff]" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(post.id); setQuery(post.title); setOpen(false); }}>{post.title}</button>)}
      {results.length === 0 ? <p className="px-3 py-3 text-sm text-[#646970]">Nenhum artigo encontrado.</p> : null}
    </div>}
  </div>;
}
