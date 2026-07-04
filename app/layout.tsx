import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import JsonLd from '@/components/JsonLd';
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
      <body className="min-h-screen bg-base font-body text-body antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
