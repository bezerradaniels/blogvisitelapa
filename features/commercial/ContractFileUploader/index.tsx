'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { addCommercialContractFile } from '@/features/commercial/actions';
import { uploadCommercialFile } from '@/lib/storage/upload';

export default function ContractFileUploader({ contractId }: { contractId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileType, setFileType] = useState<'contrato_assinado' | 'briefing' | 'proposta' | 'recibo' | 'midia' | 'outro'>('contrato_assinado');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function selectFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const upload = await uploadCommercialFile(file, contractId);
      if (!upload.path) return setError(upload.error ?? 'Não foi possível enviar o arquivo.');
      const result = await addCommercialContractFile({
        contractId,
        fileType,
        filePath: upload.path,
        fileName: file.name,
      });
      if (!result.ok) return setError(result.error);
      setMessage('Arquivo anexado ao contrato.');
      router.refresh();
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div className="rounded-[14px] border border-dashed border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Select id="contract-file-type" label="Tipo de arquivo" value={fileType} onChange={(event) => setFileType(event.target.value as typeof fileType)} options={[
            { value: 'contrato_assinado', label: 'Contrato assinado' }, { value: 'briefing', label: 'Briefing' }, { value: 'proposta', label: 'Proposta' }, { value: 'recibo', label: 'Recibo' }, { value: 'midia', label: 'Mídia' }, { value: 'outro', label: 'Outro' },
          ]} />
        </div>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => inputRef.current?.click()}>{pending ? 'Enviando...' : 'Anexar arquivo'}</Button>
        <input ref={inputRef} type="file" className="hidden" accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx" onChange={(event) => selectFile(event.target.files?.[0])} />
      </div>
      <p className="mt-2 text-xs text-muted">PDF, DOC, DOCX, JPG, PNG ou WEBP, até 10 MB. Arquivos são privados e acessíveis apenas por administradores.</p>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {message && <p role="status" className="mt-2 text-sm text-brand-dark">{message}</p>}
    </div>
  );
}
