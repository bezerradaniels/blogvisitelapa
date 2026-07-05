'use client';

// Aviso de consentimento de cookies (LGPD).
// A escolha é guardada em localStorage; o banner some após aceitar/recusar.
// Enquanto não houver consentimento, scripts não essenciais (analytics/ads)
// não devem ser carregados — use consentGiven() para checar antes de ativá-los.
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vl-cookie-consent'; // 'accepted' | 'rejected'

export function consentGiven(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === 'accepted';
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  // Só decide a visibilidade no cliente (evita mismatch de hidratação).
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Se o storage estiver indisponível, mostra o aviso mesmo assim.
      setVisible(true);
    }
  }, []);

  function decide(choice: 'accepted' | 'rejected') {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ignora falha de storage; ao menos oculta o aviso na sessão.
    }
    setVisible(false);
    // Notifica quem quiser reagir ao consentimento (ex.: ativar analytics).
    window.dispatchEvent(new CustomEvent('vl-cookie-consent', { detail: choice }));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="container-page card-base flex flex-col gap-3 border border-line p-4 shadow-[0_2px_0_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          Usamos cookies para manter você conectado e, com o seu consentimento, medir o uso do site
          e exibir anúncios. Saiba mais na{' '}
          <Link href="/politica-de-cookies" className="font-semibold text-brand underline">
            Política de Cookies
          </Link>{' '}
          e na{' '}
          <Link href="/politica-de-privacidade" className="font-semibold text-brand underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide('rejected')}
            className="rounded-full border border-line px-4 py-2 text-sm font-bold text-body hover:bg-surface"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
