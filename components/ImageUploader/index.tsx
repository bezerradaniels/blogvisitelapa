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
  // compact: em vez do dropzone grande, mostra só um botão pequeno (+ miniatura).
  compact?: boolean;
  // profile: cartão horizontal para alteração de avatar, inspirado em perfis sociais.
  profile?: {
    primaryText: string;
    secondaryText?: string;
  };
}

export default function ImageUploader({
  bucket,
  prefix,
  value,
  onChange,
  label = 'Imagem',
  ratio = 'aspect-[16/10]',
  compact = false,
  profile,
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

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  if (profile) {
    const initial = profile.primaryText.charAt(0).toUpperCase() || 'U';
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-body">{label}</span>
        <div className="flex flex-wrap items-center gap-4 rounded-[24px] bg-surface p-4 sm:flex-nowrap sm:px-6 sm:py-5">
          {value ? (
            <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-soft sm:h-24 sm:w-24">
              <Image src={value} alt="Foto de perfil" fill sizes="96px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-soft text-3xl font-extrabold text-brand-dark sm:h-24 sm:w-24 sm:text-4xl">
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-title">{profile.primaryText || 'Seu perfil'}</p>
            {profile.secondaryText && <p className="truncate text-sm text-muted sm:text-base">{profile.secondaryText}</p>}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-10 shrink-0 rounded-[10px] bg-brand px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:px-6"
          >
            {uploading ? 'Enviando...' : 'Mudar foto'}
          </button>
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
        {fileInput}
      </div>
    );
  }

  // Modo compacto: um botão pequeno; se já houver imagem, miniatura + remover.
  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-body">{label}</span>
        {value ? (
          <div className="flex items-center gap-2">
            <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-[10px] border border-line bg-surface">
              <Image src={value} alt="Pré-visualização" fill sizes="80px" className="object-cover" />
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-danger hover:text-danger"
            >
              <Icon icon="Cancel01Icon" size={14} />
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-body hover:border-brand hover:text-brand"
          >
            <Icon icon="ImageAdd01Icon" size={16} />
            {uploading ? 'Enviando...' : 'Enviar imagem'}
          </button>
        )}
        {error && <span className="text-xs text-danger">{error}</span>}
        {fileInput}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-body">{label}</span>
      <div className={`relative overflow-hidden rounded-[10px] border border-line bg-surface ${ratio}`}>
        {value ? (
          <>
            <Image src={value} alt="Pré-visualização" fill sizes="400px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remover imagem"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
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
            <Icon icon="ImageAdd01Icon" size={28} />
            <span className="text-xs">{uploading ? 'Enviando...' : 'Enviar imagem'}</span>
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
      {fileInput}
    </div>
  );
}
