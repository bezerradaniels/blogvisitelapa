'use client';

// Adiciona uma entrada ao histórico (CRM) de um cliente.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { addClientHistory } from '@/features/admin/clientsActions';

export default function ClientHistoryForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [type, setType] = useState('nota');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pending, start] = useTransition();

  function add() {
    start(async () => {
      await addClientHistory(clientId, { entry_type: type, title, content });
      setTitle('');
      setContent('');
      router.refresh();
    });
  }

  return (
    <div className="card-base space-y-3 p-4">
      <span className="text-sm font-bold text-title">Registrar no histórico</span>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { value: 'nota', label: 'Nota' },
            { value: 'contato', label: 'Contato' },
            { value: 'contrato', label: 'Contrato' },
            { value: 'pagamento', label: 'Pagamento' },
          ]}
        />
        <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <Textarea label="Detalhes" rows={2} value={content} onChange={(e) => setContent(e.target.value)} />
      <Button onClick={add}>{pending ? 'Salvando...' : 'Adicionar'}</Button>
    </div>
  );
}
