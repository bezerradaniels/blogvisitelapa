'use client';

// Formulário de criação/edição de post (publisher e admin).
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { JSONContent } from '@tiptap/react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import type { GalleryItem } from '@/components/GalleryUploader';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import RichTextEditor from '@/components/RichTextEditor';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { savePost, type PostInput } from '@/features/publisher/actions';
import { CategoryPicker, SubcategoryPicker, type CategoryOption } from '@/features/publisher/CategorySelect';
import PublishChecklist from '@/features/publisher/PublishChecklist';
import { slugify } from '@/lib/utils/format';

export interface PostFormInitial extends Partial<PostInput> {
  galleryItems?: GalleryItem[];
}

interface PostFormProps {
  categories: CategoryOption[];
  initial?: PostFormInitial;
  canPublish: boolean;
}

const contentTypes = [
  { value: 'noticia', label: 'Notícia' },
  { value: 'evento', label: 'Evento' },
  { value: 'guia', label: 'Guia' },
  { value: 'publieditorial', label: 'Publieditorial' },
  { value: 'conteudo_patrocinado', label: 'Conteúdo patrocinado' },
  { value: 'comunidade', label: 'Comunidade' },
  { value: 'turismo', label: 'Turismo' },
  { value: 'religiosidade', label: 'Religiosidade' },
];

export default function PostForm({ categories, initial, canPublish }: PostFormProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estado do formulário
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [contentHtml, setContentHtml] = useState(initial?.content_html ?? '');
  const [contentJson, setContentJson] = useState<JSONContent | null>(
    (initial?.content_json as JSONContent) ?? null,
  );

  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_image_url ?? null);
  const [coverAlt, setCoverAlt] = useState(initial?.cover_image_alt ?? '');
  // Galeria dedicada removida da UI (imagens agora vão pelo editor); mantém o
  // valor existente ao editar para não descartar galerias já salvas.
  const [gallery] = useState<GalleryItem[]>(initial?.galleryItems ?? []);

  // Categorias em estado local para refletir criações inline no dropdown.
  const [cats, setCats] = useState<CategoryOption[]>(categories);
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [contentType, setContentType] = useState<PostInput['content_type']>(
    (initial?.content_type as PostInput['content_type']) ?? 'noticia',
  );
  const [tags, setTags] = useState(initial?.tags ?? '');

  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [isSponsored, setIsSponsored] = useState(initial?.is_sponsored ?? false);
  const [isEvent, setIsEvent] = useState(initial?.is_event ?? false);

  const [eventStart, setEventStart] = useState(initial?.event_start_date ?? '');
  const [eventEnd, setEventEnd] = useState(initial?.event_end_date ?? '');
  const [eventLocation, setEventLocation] = useState(initial?.event_location ?? '');
  const [eventAddress, setEventAddress] = useState(initial?.event_address ?? '');
  const [eventTicket, setEventTicket] = useState(initial?.event_ticket_url ?? '');
  const [eventOrganizer, setEventOrganizer] = useState(initial?.event_organizer ?? '');
  const [eventMap, setEventMap] = useState(initial?.event_map_url ?? '');
  const [eventIsFree, setEventIsFree] = useState(initial?.event_is_free ?? false);

  const [sourceNote, setSourceNote] = useState(initial?.source_note ?? '');
  const [editorialNotes, setEditorialNotes] = useState(initial?.editorial_notes ?? '');

  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? '');
  const [focusKeyword, setFocusKeyword] = useState(initial?.focus_keyword ?? '');
  const [localKeyword, setLocalKeyword] = useState(initial?.local_seo_keyword ?? '');
  const [socialTitle, setSocialTitle] = useState(initial?.social_title ?? '');
  const [socialDescription, setSocialDescription] = useState(initial?.social_description ?? '');
  const [socialImage, setSocialImage] = useState<string | null>(initial?.social_image_url ?? null);
  const [allowIndexing, setAllowIndexing] = useState(initial?.allow_indexing ?? true);
  const [includeSitemap, setIncludeSitemap] = useState(initial?.include_in_sitemap ?? true);
  const [includeRss, setIncludeRss] = useState(initial?.include_in_rss ?? true);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function submit(action: PostInput['action']) {
    setError(null);
    const input: PostInput = {
      id: initial?.id,
      action,
      title,
      subtitle,
      slug,
      excerpt,
      content_html: contentHtml,
      content_json: contentJson ?? undefined,
      cover_image_url: coverUrl ?? '',
      cover_image_alt: coverAlt,
      gallery,
      category_id: categoryId,
      content_type: contentType,
      tags,
      is_featured: isFeatured,
      is_sponsored: isSponsored,
      is_event: isEvent,
      event_start_date: eventStart,
      event_end_date: eventEnd,
      event_location: eventLocation,
      event_address: eventAddress,
      event_ticket_url: eventTicket,
      event_organizer: eventOrganizer,
      event_map_url: eventMap,
      event_is_free: eventIsFree,
      source_note: sourceNote,
      editorial_notes: editorialNotes,
      seo_title: seoTitle,
      seo_description: seoDescription,
      focus_keyword: focusKeyword,
      local_seo_keyword: localKeyword,
      social_title: socialTitle,
      social_description: socialDescription,
      social_image_url: socialImage ?? '',
      allow_indexing: allowIndexing,
      include_in_sitemap: includeSitemap,
      include_in_rss: includeRss,
    };

    start(async () => {
      const result = await savePost(input);
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar.');
        return;
      }
      router.push('/publisher');
      router.refresh();
    });
  }

  const section = 'card-base space-y-3 p-4';
  const sectionTitle = 'text-sm font-bold text-title';

  // Sinais para o checklist AEO/GEO automático.
  const checklistData = {
    title,
    slug,
    excerpt,
    contentHtml,
    seoDescription,
    focusKeyword,
    coverUrl,
    coverAlt,
    categoryId,
    sourceNote,
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-4 lg:grid-cols-[1fr_320px]"
    >
      {/* Coluna principal */}
      <div className="space-y-4">
        <div className={section}>
          <Input label="Título do post" value={title} onChange={(e) => onTitleChange(e.target.value)} required />
          <Input label="Subtítulo" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          <Input
            label="Slug (URL)"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="gerado a partir do título"
          />
          <Textarea label="Resumo" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>

        <div className={section}>
          <span className={sectionTitle}>Conteúdo</span>
          <RichTextEditor
            initialHTML={contentHtml}
            prefix={initial?.id}
            onChange={(html, json) => {
              setContentHtml(html);
              setContentJson(json);
            }}
          />
        </div>

        {isEvent && (
          <div className={section}>
            <span className={sectionTitle}>Dados do evento</span>
            <Checkbox label="Evento gratuito" checked={eventIsFree} onChange={(e) => setEventIsFree(e.target.checked)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Data de início" type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
              <Input label="Data de término" type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} />
              <Input label="Local" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              <Input label="Endereço" value={eventAddress} onChange={(e) => setEventAddress(e.target.value)} />
              <Input label="Link de ingresso" value={eventTicket} onChange={(e) => setEventTicket(e.target.value)} disabled={eventIsFree} />
              <Input label="Organizador" value={eventOrganizer} onChange={(e) => setEventOrganizer(e.target.value)} />
              <Input label="Link do mapa" value={eventMap} onChange={(e) => setEventMap(e.target.value)} />
            </div>
          </div>
        )}

        <div className={section}>
          <span className={sectionTitle}>SEO e redes sociais</span>
          <Input label="Título para SEO" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          <Textarea label="Descrição para SEO" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Palavra-chave principal" value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} />
            <Input label="Palavra-chave local" value={localKeyword} onChange={(e) => setLocalKeyword(e.target.value)} />
          </div>
          <Input label="Título para redes sociais" value={socialTitle} onChange={(e) => setSocialTitle(e.target.value)} />
          <Textarea label="Descrição para redes sociais" rows={2} value={socialDescription} onChange={(e) => setSocialDescription(e.target.value)} />
          <ImageUploader bucket="post-covers" prefix="social" value={socialImage} onChange={setSocialImage} label="Imagem para compartilhamento" compact />
        </div>

        <div className={section}>
          <span className={sectionTitle}>Editorial</span>
          <Input label="Fonte da informação" value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} />
          <Textarea label="Observações editoriais" rows={2} value={editorialNotes} onChange={(e) => setEditorialNotes(e.target.value)} />
        </div>
      </div>

      {/* Sidebar de opções */}
      <aside className="space-y-4">
        <div className={section}>
          <span className={sectionTitle}>Publicação</span>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={() => submit('rascunho')}>
              {pending ? 'Salvando...' : 'Salvar rascunho'}
            </Button>
            <Button variant="outline" onClick={() => submit('enviar')}>
              Enviar para revisão
            </Button>
            {canPublish && (
              <Button variant="secondary" onClick={() => submit('publicar')}>
                Publicar agora
              </Button>
            )}
          </div>
        </div>

        <div className={section}>
          <span className={sectionTitle}>Capa</span>
          <ImageUploader bucket="post-covers" prefix={initial?.id} value={coverUrl} onChange={setCoverUrl} label="Imagem principal (16:10)" />
          <Input label="Texto alternativo da capa" value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} />
        </div>

        <div className={section}>
          <span className={sectionTitle}>Classificação</span>
          <CategoryPicker
            categories={cats}
            categoryId={categoryId}
            onChange={setCategoryId}
            onCreated={(c) => {
              setCats((prev) => [...prev, c]);
              setCategoryId(c.id);
            }}
          />
          <SubcategoryPicker
            categories={cats}
            categoryId={categoryId}
            onChange={setCategoryId}
            onCreated={(c) => {
              setCats((prev) => [...prev, c]);
              setCategoryId(c.id);
            }}
          />
          <Select
            label="Tipo de conteúdo"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as PostInput['content_type'])}
            options={contentTypes}
          />
          <Input label="Tags (separadas por vírgula)" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className={section}>
          <span className={sectionTitle}>Opções</span>
          <Checkbox label="Marcar como destaque" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          <Checkbox label="Marcar como patrocinado" checked={isSponsored} onChange={(e) => setIsSponsored(e.target.checked)} />
          <Checkbox label="É um evento" checked={isEvent} onChange={(e) => setIsEvent(e.target.checked)} />
          <hr className="border-line" />
          <Checkbox label="Permitir indexação" checked={allowIndexing} onChange={(e) => setAllowIndexing(e.target.checked)} />
          <Checkbox label="Incluir no sitemap" checked={includeSitemap} onChange={(e) => setIncludeSitemap(e.target.checked)} />
          <Checkbox label="Incluir no RSS" checked={includeRss} onChange={(e) => setIncludeRss(e.target.checked)} />
        </div>

        {/* Checklist AEO/GEO — automático, por último na coluna (apenas desktop) */}
        <div className="hidden lg:block">
          <PublishChecklist postId={initial?.id} data={checklistData} />
        </div>
      </aside>
    </form>
  );
}
