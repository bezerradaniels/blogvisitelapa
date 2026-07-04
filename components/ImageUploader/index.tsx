'use client';

// Upload de uma imagem única (ex.: capa). Mostra preview e permite remover.
import Image from 'next/image';
import { useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { uploadImage, type UploadBucket } from '@/lib/storage/upload';

interface ImageUploaderProps {
  bucket: UploadBucket;
  prefix?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  ratio?: string;
}

export default function ImageUploader({
  bucket,
  prefix,
  value,
  onChange,
  label = 'Imagem',
  ratio = 'aspect-[16/10]',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    const { url, error: err } = await uploadImage(file, bucket, prefix);
    setUploading(false);
    if (err) return setError(err);
    onChange(url);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-body">{label}</span>
      <div className={`relative overflow-hidden rounded border border-line bg-surface ${ratio}`}>
        {value ? (
          <>
            <Image src={value} alt="Pré-visualização" fill sizes="400px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remover imagem"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded bg-black/60 text-white"
            >
              <Icon icon="Cancel01Icon" size={18} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted hover:text-brand"
          >
            <Icon icon="Image01Icon" size={28} />
            <span className="text-xs">{uploading ? 'Enviando...' : 'Enviar imagem'}</span>
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
