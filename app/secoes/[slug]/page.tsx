import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ListingView from '@/features/posts/ListingView';
import { getPublicHomeSection } from '@/features/homeSections/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const revalidate = 120;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const section = await getPublicHomeSection(slug);
  if (!section) return buildMetadata({ title: 'Seção não encontrada', path: `/secoes/${slug}`, noindex: true });
  return buildMetadata({ title: section.title, description: section.description || section.subtitle || undefined, path: `/secoes/${section.slug}`, image: section.cover_image_url });
}
export default async function HomeSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const section = await getPublicHomeSection(slug); if (!section) notFound();
  return <><div className="container-page pt-6"><Link href="/" className="text-sm font-semibold text-brand hover:underline">Início</Link>{section.cover_image_url && <div className="relative mt-4 aspect-[3/1] overflow-hidden rounded-xl bg-surface"><Image src={section.cover_image_url} alt={section.cover_image_alt || section.title} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" /></div>}</div><ListingView title={section.title} description={[section.subtitle, section.description].filter(Boolean).join(' — ')} posts={section.posts} emptyTitle="Esta seção não possui posts públicos" /></>;
}
