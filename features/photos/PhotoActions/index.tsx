'use client';

// Botões de exclusão de foto e de álbum (dono).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteAlbum, deletePhoto } from '@/features/photos/actions';

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deletePhoto(photoId);
          if (res.ok) router.refresh();
        })
      }
      className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white hover:bg-danger"
    >
      Excluir
    </button>
  );
}

export function DeleteAlbumButton({ albumId, slug }: { albumId: string; slug: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Excluir o álbum e todas as fotos?')) return;
        start(async () => {
          const res = await deleteAlbum(albumId);
          if (res.ok) {
            router.push(`/u/${slug}/fotos`);
            router.refresh();
          }
        });
      }}
      className="text-xs font-semibold text-danger hover:underline"
    >
      Excluir álbum
    </button>
  );
}
