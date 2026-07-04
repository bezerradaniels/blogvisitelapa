// Tipos de domínio de posts, derivados do schema.
import type { Tables } from './database';

export type Post = Tables<'posts'>;
export type Category = Tables<'categories'>;
export type Tag = Tables<'tags'>;
export type Comment = Tables<'comments'>;

// Autor resumido para cards e assinatura de matéria.
export interface PostAuthor {
  id: string;
  full_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  role: string;
  bio?: string | null;
}

// Post com relações usadas na listagem/detalhe.
export interface PostWithRelations extends Post {
  category: Pick<Category, 'id' | 'name' | 'slug' | 'icon_name'> | null;
  author: PostAuthor | null;
  tags?: Pick<Tag, 'id' | 'name' | 'slug'>[];
}

// Comentário com o autor embutido.
export interface CommentWithAuthor extends Comment {
  author: Pick<PostAuthor, 'full_name' | 'avatar_url' | 'slug'> | null;
}
