'use client';

// Baixa os dados do usuário como um arquivo JSON (gerado no servidor, com RLS).
import { useState } from 'react';
import Button from '@/components/Button';
import { exportMyData } from '@/features/settings/account';

export default function DataExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function download() {
    setError(null);
    setDone(false);
    setLoading(true);
    const res = await exportMyData();
    setLoading(false);
    if (!res.ok || !res.json) {
      setError(res.error ?? 'Não foi possível exportar.');
      return;
    }
    const blob = new Blob([res.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meus-dados-conectalapa-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDone(true);
  }

  return (
    <div className="space-y-2">
      <Button variant="primary" size="sm" onClick={download} disabled={loading}>
        {loading ? 'Gerando…' : 'Baixar meus dados (JSON)'}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
      {done && <p className="text-sm text-brand-dark">Download iniciado.</p>}
    </div>
  );
}
