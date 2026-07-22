import type { Metadata } from 'next';
import ChromeGate from '@/components/ChromeGate';
import CookieBanner from '@/components/CookieBanner';
import Footer from '@/components/Footer';
import GoogleTagManager from '@/components/GoogleTagManager';
import Header from '@/components/Header';
import JsonLd from '@/components/JsonLd';
import ScrollToTop from '@/components/ScrollToTop';
import { fontBody, fontHeadline } from '@/lib/fonts';
import { buildMetadata } from '@/lib/seo/metadata';
import { organizationSchema, websiteSchema } from '@/lib/seo/schema';
import { cn } from '@/lib/utils/cn';
import './globals.css';

// Metadata base do site (verificação de propriedade incluída quando configurada).
export const metadata: Metadata = {
  ...buildMetadata(),
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn(fontHeadline.variable, fontBody.variable)}>
      <body className="flex min-h-dvh flex-col bg-base font-body text-body antialiased">
        <GoogleTagManager />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <ScrollToTop />
        <ChromeGate>
          <Header />
        </ChromeGate>
        <main className="flex-1">{children}</main>
        <ChromeGate>
          <Footer />
        </ChromeGate>
        <ChromeGate>
          <CookieBanner />
        </ChromeGate>
      </body>
    </html>
  );
}
