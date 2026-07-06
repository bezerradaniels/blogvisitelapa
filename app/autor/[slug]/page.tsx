import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo/metadata';
import type { PostWithRelations } from '@/types/posts';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

async function getAuthor(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return buildMetadata({ title: 'Autor', noindex: true });
  return buildMetadata({
    title: author.full_name ?? 'Autor',
    description: author.bio ?? `Conteúdos publicados por ${author.full_name}.`,
    path: `/autor/${slug}`,
  });
}

export default async function AutorPage({ params }: Props) {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('*, category:categories(id, name, slug, icon_name), author:profiles!posts_author_id_fkey(id, full_name, slug, avatar_url, role, bio)')
    .eq('author_id', author.id)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .order('published_at', { ascending: false })
    .limit(24);
  const posts = (data ?? []) as unknown as PostWithRelations[];

  // Sem publicações, não é uma página de autor de fato: evita conteúdo raso
  // e páginas de autor indexáveis para cada usuário comum.
  if (posts.length === 0) notFound();

  return (
    <div className="container-page py-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        {author.avatar_url && (
          <Image
            src={author.avatar_url}
            alt={author.full_name ?? 'Autor'}
            width={72}
            height={72}
            className="rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-xl font-extrabold text-title md:text-2xl">{author.full_name}</h1>
          <p className="text-xs uppercase tracking-wide text-muted">
            {author.role === 'admin' ? 'Editor' : 'Colaborador'}
          </p>
          {author.bio && <p className="mt-1 max-w-2xl text-sm text-muted">{author.bio}</p>}
          {author.slug && (
            <Link href={`/u/${author.slug}`} className="mt-2 inline-block text-sm font-bold text-brand hover:underline">
              Ver perfil →
            </Link>
          )}
        </div>
      </header>

      {posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum conteúdo publicado ainda" />
      )}
    </div>
  );
}
