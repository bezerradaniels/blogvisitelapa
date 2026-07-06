// Tipos de domínio dos álbuns de fotos.
import type { Tables } from './database';

export type PhotoAlbum = Tables<'photo_albums'>;
export type Photo = Tables<'photos'>;

export type AlbumWithCount = PhotoAlbum & { photo_count: number };
