'use client';

// Ações do dono do perfil sobre um depoimento: aprovar, ocultar, excluir.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  approveTestimonial,
  deleteTestimonial,
  hideTestimonial,
} from '@/features/social/actions';

interface TestimonialModActionsProps {
  testimonialId: string;
  status: string;
}

export default function TestimonialModActions({ testimonialId, status }: TestimonialModActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean }>) {
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {status !== 'aprovado' && (
        <button disabled={pending} onClick={() => run(() => approveTestimonial(testimonialId))} className="text-brand hover:underline">
          Aprovar
        </button>
      )}
      {status !== 'oculto' && (
        <button disabled={pending} onClick={() => run(() => hideTestimonial(testimonialId))} className="text-muted hover:underline">
          Ocultar
        </button>
      )}
      <button disabled={pending} onClick={() => run(() => deleteTestimonial(testimonialId))} className="text-danger hover:underline">
        Excluir
      </button>
    </div>
  );
}
