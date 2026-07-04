'use client';

// Upload de múltiplas imagens para a galeria do post.
import Image from 'next/image';
import { useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { uploadImage } from '@/lib/storage/upload';

export interface GalleryItem {
  url: string;
  alt: string;
}

interface GalleryUploaderProps {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  prefix?: string;
}

export default function GalleryUploader({ value, onChange, prefix }: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const added: GalleryItem[] = [];
    for (const file of Array.from(files)) {
      const { url, error: err } = await uploadImage(file, 'post-gallery', prefix);
      if (err) {
        setError(err);
        continue;
      }
      if (url) added.push({ url, alt: '' });
    }
    setUploading(false);
    onChange([...value, ...added]);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function setAlt(index: number, alt: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, alt } : item)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-body">Galeria de imagens</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-brand hover:underline"
        >
          <Icon icon="Image01Icon" size={16} />
          {uploading ? 'Enviando...' : 'Adicionar imagens'}
        </button>
      </div>

      {error && <span className="text-xs text-danger">{error}</span>}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((item, i) => (
            <div key={item.url} className="card-base overflow-hidden p-1">
              <div className="relative aspect-[16/10]">
                <Image src={item.url} alt={item.alt || 'Imagem'} fill sizes="200px" className="rounded object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remover"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white"
                >
                  <Icon icon="Cancel01Icon" size={14} />
                </button>
              </div>
              <input
                type="text"
                value={item.alt}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Texto alternativo"
                className="mt-1 w-full rounded border border-line px-2 py-1 text-xs outline-none focus:border-brand"
              />
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
