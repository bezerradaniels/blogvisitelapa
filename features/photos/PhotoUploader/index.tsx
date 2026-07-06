'use client';

// Envia várias fotos para um álbum (upload no bucket user-photos + addPhotos).
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { addPhotos } from '@/features/photos/actions';
import { uploadImage } from '@/lib/storage/upload';

interface PhotoUploaderProps {
  albumId: string;
  userId: string;
}

export default function PhotoUploader({ albumId, userId }: PhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 30)) {
      const { url, error: err } = await uploadImage(file, 'user-photos', userId);
      if (err) {
        setError(err);
        continue;
      }
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      const res = await addPhotos(albumId, urls);
      if (!res.ok) setError(res.error ?? 'Falha ao salvar as fotos.');
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex h-9 items-center justify-center rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? 'Enviando...' : 'Adicionar fotos'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
