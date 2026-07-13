'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Garante que links para uma nova página comecem no topo. Alterações de query
// na própria rota (ex.: filtros e abas) preservam a posição atual.
export default function ScrollToTop() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      window.scrollTo(0, 0);
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
