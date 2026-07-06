'use client';

// Busca do header: botão (ícone) que abre um modal com campo de pesquisa.
// Ao enviar, navega para /busca?q=... (mesma página de resultados).
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Trava o scroll do body, foca o campo e fecha no Esc enquanto aberto.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/busca?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-title hover:bg-brand-soft"
      >
        <Icon icon="Search01Icon" size={20} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[15vh]"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar no site"
          >
          <button
            type="button"
            aria-label="Fechar busca"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <form
            onSubmit={submit}
            className="relative w-full max-w-xl rounded-lg border border-line bg-card p-4 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <Icon icon="Search01Icon" size={20} />
              <input
                ref={inputRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar notícias, eventos e guias..."
                aria-label="Buscar"
                className="h-11 w-full bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar busca"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-title hover:bg-surface"
              >
                <Icon icon="Cancel01Icon" size={20} />
              </button>
            </div>
          </form>
          </div>,
          document.body,
        )}
    </>
  );
}
