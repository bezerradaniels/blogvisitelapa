'use client';

// Botão de logout reutilizável. Encerra a sessão no Supabase e volta para a home.
// Usado no header mobile, no perfil e nos painéis (admin/publisher).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  redirectTo?: string;
  onDone?: () => void;
}

export default function LogoutButton({
  className,
  children = 'Sair da conta',
  redirectTo = '/',
  onDone,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    onDone?.();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={cn('disabled:opacity-60', className)}
    >
      {loading ? 'Saindo…' : children}
    </button>
  );
}
