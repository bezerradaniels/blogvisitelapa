'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import { convertCommercialLead, type ClientDuplicate } from '@/features/commercial/actions';

export default function LeadConversionButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [duplicates, setDuplicates] = useState<ClientDuplicate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function convert(confirmSimilar = false) {
    setError(null);
    startTransition(async () => {
      const result = await convertCommercialLead({ leadId, confirmSimilar });
      if (!result.ok) {
        setError(result.error);
        setDuplicates(result.duplicates ?? []);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant="outline" onClick={() => convert(false)} disabled={pending}>{pending ? 'Convertendo...' : 'Converter em cliente'}</Button>
      {duplicates.length > 0 && <div className="max-w-[260px] rounded-[10px] bg-warning/10 p-2 text-right text-[11px] text-body"><p>Possível duplicidade: {duplicates.map((duplicate) => duplicate.clientName).join(', ')}.</p><button type="button" className="mt-1 font-bold text-brand-dark underline" onClick={() => convert(true)} disabled={pending}>Criar mesmo assim</button></div>}
      {error && duplicates.length === 0 && <span role="alert" className="max-w-[220px] text-right text-xs text-danger">{error}</span>}
    </div>
  );
}
