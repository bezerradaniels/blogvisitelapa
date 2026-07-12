import type { ReactNode } from 'react';
import SocialBg from '@/components/SocialBg';
import SocialShell from '@/components/SocialShell';

export default function RedeLayout({ children }: { children: ReactNode }) {
  return <SocialBg><SocialShell>{children}</SocialShell></SocialBg>;
}
