'use client';

// Editor WYSIWYG (Tiptap). Emite HTML + JSON ao editar.
// Preparado para futura integração com Google Docs (o conteúdo é armazenado
// tanto como HTML sanitizável quanto como JSON estruturado).
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import Icon from '@/components/Icon';
import { uploadImage } from '@/lib/storage/upload';
import { cn } from '@/lib/utils/cn';

interface RichTextEditorProps {
  initialHTML?: string;
  onChange: (html: string, json: JSONContent) => void;
  prefix?: string;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm',
        active ? 'bg-brand text-white' : 'text-body hover:bg-surface',
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, prefix }: { editor: Editor; prefix?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function insertImage(file: File | undefined) {
    if (!file) return;
    const { url } = await uploadImage(file, 'post-gallery', prefix);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  function toggleLink() {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line p-1">
      <ToolbarButton label="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>N</strong>
      </ToolbarButton>
      <ToolbarButton label="Itálico" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton label="Título 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton label="Título 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <ToolbarButton label="Parágrafo" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
        ¶
      </ToolbarButton>
      <ToolbarButton label="Lista com marcadores" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •
      </ToolbarButton>
      <ToolbarButton label="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolbarButton>
      <ToolbarButton label="Citação" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={toggleLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton label="Imagem" onClick={() => fileRef.current?.click()}>
        <Icon icon="Image01Icon" size={16} />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolbarButton label="Desfazer" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton label="Refazer" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>
      <ToolbarButton label="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        ⌫
      </ToolbarButton>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => insertImage(e.target.files?.[0])} />
    </div>
  );
}

export default function RichTextEditor({ initialHTML, onChange, prefix }: RichTextEditorProps) {
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    // Evita mismatch de hidratação no SSR do Next.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      ImageExt.configure({ HTMLAttributes: { class: 'rounded-lg' } }),
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do post...' }),
    ],
    content: initialHTML ?? '',
    editorProps: {
      attributes: { class: 'prose-post min-h-[280px] p-3 outline-none' },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML(), ed.getJSON()),
  });

  if (!editor) {
    return <div className="card-base h-64 animate-pulse bg-surface" aria-hidden />;
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface px-2 py-1">
        <span className="text-xs font-medium text-muted">Editor</span>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="text-xs font-medium text-brand hover:underline"
        >
          {preview ? 'Voltar a editar' : 'Pré-visualizar'}
        </button>
      </div>

      {preview ? (
        <div className="prose-post min-h-[280px] p-3" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
      ) : (
        <>
          <Toolbar editor={editor} prefix={prefix} />
          <EditorContent editor={editor} />
        </>
      )}
    </div>
  );
}
