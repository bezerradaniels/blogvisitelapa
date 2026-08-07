'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { homeEditorialAreas, type HomeEditorialAreaKey } from '@/lib/config/homeEditorial';
import { saveHomeEditorialSlots } from './actions';

interface Candidate { id: string; title: string; }

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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {area.labels.map((label, index) => <label key={label} className="grid gap-1 text-xs font-semibold text-[#50575e]">
          <span>{index + 1}. {label}</span>
          <select className="admin-control" value={slots[area.key][index] ?? ''} onChange={(event) => select(area.key, index, event.target.value)}>
            <option value="">Preenchimento automático</option>
            {candidates.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
          </select>
        </label>)}
      </div>
    </section>)}
    <div className="flex items-center gap-3"><button type="button" className="admin-button admin-button-primary" disabled={pending} onClick={() => start(async () => { const result = await saveHomeEditorialSlots(slots); setMessage(result.ok ? 'Posições salvas.' : result.error ?? 'Erro ao salvar.'); if (result.ok) router.refresh(); })}>{pending ? 'Salvando…' : 'Salvar posições'}</button>{message && <p className="text-sm text-[#50575e]">{message}</p>}</div>
  </div>;
}
