'use client';

// Gestão de patrocínios (artigos ou eventos). Vincula um post + rótulo.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { addSponsored, toggleSponsored, type SponsoredKind } from '@/features/admin/sponsoredActions';
import { formatDate } from '@/lib/utils/format';

interface PostOption { id: string; title: string; slug: string }
interface SponsoredRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  post: { title: string; slug: string } | null;
}

interface ContractItemOption {
  id: string;
  contract_id: string;
  label: string;
}

export default function SponsoredManager({
  kind,
  posts,
  entries,
  contractItems = [],
}: {
  kind: SponsoredKind;
  posts: PostOption[];
  entries: SponsoredRow[];
  contractItems?: ContractItemOption[];
}) {
  const router = useRouter();
  const [postId, setPostId] = useState('');
  const [label, setLabel] = useState('');
  const [contractItemId, setContractItemId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setError(null);
    start(async () => {
      const res = await addSponsored(kind, { postId, label, contractItemId });
      if (!res.ok) return setError(res.error ?? 'Erro.');
      setPostId('');
      setLabel('');
      setContractItemId('');
      router.refresh();
    });
  }

  function toggle(id: string, active: boolean) {
    if (!active && !window.confirm('Desativar este patrocínio? O vínculo será preservado no histórico.')) return;
    start(async () => {
      const res = await toggleSponsored(kind, id, active);
      if (!res.ok) return setError(res.error ?? 'Não foi possível atualizar.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="card-base space-y-3 p-4">
        <span className="text-sm font-bold text-title">Novo patrocínio</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Post"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            placeholder="Selecione um post..."
            options={posts.map((p) => ({ value: p.id, label: p.title }))}
          />
          <Select
            label="Item contratado"
            value={contractItemId}
            onChange={(e) => setContractItemId(e.target.value)}
            placeholder={contractItems.length ? 'Selecione o entregável contratado' : 'Nenhum item de conteúdo disponível'}
            disabled={contractItems.length === 0}
            options={contractItems.map((item) => ({ value: item.id, label: item.label }))}
          />
          <Input label="Rótulo" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === 'article' ? 'Conteúdo patrocinado' : 'Evento patrocinado'} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={add} disabled={pending || !contractItemId}>{pending ? 'Salvando...' : 'Vincular patrocínio'}</Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">Nenhum patrocínio cadastrado.</p>
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Post</th>
                <th className="p-3">Rótulo</th>
                <th className="p-3">Ativo</th>
                <th className="p-3">Desde</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((s) => (
                <tr key={s.id}>
                  <td className="p-3">
                    {s.post ? (
                      <Link href={`/post/${s.post.slug}`} className="font-medium text-title hover:text-brand">{s.post.title}</Link>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-muted">{s.label}</td>
                  <td className="p-3">{s.is_active ? 'Sim' : 'Não'}</td>
                  <td className="p-3 text-muted">{formatDate(s.created_at)}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => toggle(s.id, !s.is_active)} className="text-xs text-brand hover:underline">
                      {s.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
