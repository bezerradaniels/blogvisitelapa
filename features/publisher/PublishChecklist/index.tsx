'use client';

// Checklist AEO/GEO padrão do formulário de post (desktop).
// A maioria dos itens é AUTOMÁTICA: são detectados a partir do estado do
// formulário (título, conteúdo, SEO, capa, categoria...). Os poucos itens
// subjetivos ficam como marcação manual (persistida em localStorage por post).
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';

export interface ChecklistData {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  seoDescription: string;
  focusKeyword: string;
  coverUrl: string | null;
  coverAlt: string;
  categoryId: string;
  sourceNote: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  // Detector automático (opcional). Sem detector = item manual.
  auto?: (d: ChecklistData) => boolean;
}

interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

// --- helpers de detecção ---------------------------------------------------
const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function firstParagraphWords(html: string): number {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const text = stripHtml(m?.[1] ?? '');
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}
function headingQuestionCount(html: string): number {
  const heads = html.match(/<h[234][^>]*>[\s\S]*?<\/h[234]>/gi) ?? [];
  return heads.filter((h) => h.includes('?')).length;
}

const GROUPS: ChecklistGroup[] = [
  {
    title: 'Conteúdo para IA e busca (AEO/GEO)',
    items: [
      {
        id: 'resposta-direta',
        label: 'Resposta direta de 40–60 palavras logo no início, com a palavra-chave principal.',
        auto: (d) => firstParagraphWords(d.contentHtml) >= 30,
      },
      {
        id: 'perguntas',
        label: 'H2/H3 escritos como perguntas reais que as pessoas fazem à IA e ao Google.',
        auto: (d) => headingQuestionCount(d.contentHtml) >= 1,
      },
      {
        id: 'faq',
        label: 'Bloco de FAQ ao final, com perguntas e respostas objetivas.',
        auto: (d) => {
          const t = norm(stripHtml(d.contentHtml));
          return t.includes('perguntas frequentes') || /\bfaq\b/.test(t) || headingQuestionCount(d.contentHtml) >= 3;
        },
      },
      {
        id: 'listas',
        label: 'Dados citáveis em listas (público, método, diferenciais) no lugar de parágrafos vagos.',
        auto: (d) => /<(ul|ol)[\s>]/i.test(d.contentHtml),
      },
      {
        id: 'fonte',
        label: 'Afirmações atribuídas à fonte ("segundo…", "de acordo com…") — reforça o E-E-A-T.',
        auto: (d) =>
          d.sourceNote.trim() !== '' ||
          /\b(segundo|de acordo com|conforme|afirma|afirmou|disse|informou)\b/.test(norm(stripHtml(d.contentHtml))),
      },
    ],
  },
  {
    title: 'Negócio local e confiança',
    items: [
      { id: 'servico', label: 'Bloco "Serviço" quando for negócio local: nome, endereço, contato e redes sociais.' },
      { id: 'apuracao', label: 'Apuração completa: nomes, valores/faixas de preço e um caso ou depoimento, se houver.' },
      {
        id: 'link-interno',
        label: 'Ao menos um link interno para outra matéria do Conecta Lapa.',
        auto: (d) => /<a\s[^>]*href\s*=\s*["'](\/[^"']*|[^"']*conectalapa[^"']*)["']/i.test(d.contentHtml),
      },
    ],
  },
  {
    title: 'SEO e metadados',
    items: [
      {
        id: 'palavra-chave',
        label: 'Palavra-chave no título (H1), no slug/URL e na descrição de SEO.',
        auto: (d) => {
          const k = norm(d.focusKeyword.trim());
          if (!k) return false;
          const slugK = k.replace(/\s+/g, '-');
          return norm(d.title).includes(k) && norm(d.slug).includes(slugK) && norm(d.seoDescription).includes(k);
        },
      },
      {
        id: 'meta',
        label: 'Descrição de SEO preenchida (~155 caracteres), atrativa e com a palavra-chave.',
        auto: (d) => {
          const n = d.seoDescription.trim().length;
          return n >= 80 && n <= 170;
        },
      },
      {
        id: 'capa-alt',
        label: 'Capa definida com texto alternativo (alt) descritivo.',
        auto: (d) => Boolean(d.coverUrl && d.coverAlt.trim()),
      },
      {
        id: 'categoria',
        label: 'Categoria e tipo de conteúdo selecionados.',
        auto: (d) => d.categoryId !== '',
      },
    ],
  },
  {
    title: 'Dados estruturados (schema)',
    items: [
      {
        id: 'newsarticle',
        label: 'NewsArticle é gerado automaticamente — confira autor, capa e datas de publicação/atualização.',
        auto: (d) => Boolean(d.title.trim() && d.coverUrl),
      },
      { id: 'faqpage', label: 'FAQ da matéria coerente com um schema FAQPage (mesmas perguntas e respostas).' },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);
const TOTAL = ALL_ITEMS.length;

interface PublishChecklistProps {
  postId?: string;
  data: ChecklistData;
}

export default function PublishChecklist({ postId, data }: PublishChecklistProps) {
  const storageKey = `vl-post-checklist-${postId ?? 'novo'}`;
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let restored: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) restored = JSON.parse(raw) as Record<string, boolean>;
    } catch {
      restored = {};
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManual(restored);
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(manual));
    } catch {
      /* ignore */
    }
  }, [manual, loaded, storageKey]);

  // Estado final de cada item: automático OU marcado manualmente.
  const state = useMemo(() => {
    const map: Record<string, { checked: boolean; auto: boolean }> = {};
    for (const item of ALL_ITEMS) {
      const auto = item.auto ? item.auto(data) : false;
      map[item.id] = { auto, checked: auto || Boolean(manual[item.id]) };
    }
    return map;
  }, [data, manual]);

  const done = ALL_ITEMS.filter((i) => state[i.id]?.checked).length;
  const complete = done === TOTAL;

  function toggle(id: string) {
    setManual((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="card-base space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-title">Checklist antes de publicar</span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
            complete ? 'bg-brand-soft text-brand-dark' : 'bg-surface text-muted'
          }`}
        >
          {done}/{TOTAL}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface" aria-hidden>
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${(done / TOTAL) * 100}%` }}
        />
      </div>

      <p className="text-xs text-muted">
        Itens marcados <strong className="text-body">automaticamente</strong> conforme você preenche o
        post. Os demais são de conferência manual.
      </p>

      <div className="space-y-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{group.title}</p>
            {group.items.map((item) => {
              const { checked, auto } = state[item.id] ?? { checked: false, auto: false };
              const circle = (
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    checked ? 'border-brand bg-brand text-white' : 'border-line bg-card text-transparent'
                  }`}
                >
                  <Icon icon="Tick02Icon" size={11} strokeWidth={3} />
                </span>
              );
              const text = (
                <span className={`text-xs leading-snug ${checked ? 'text-muted line-through' : 'text-body'}`}>
                  {item.label}
                  {auto && <span className="ml-1 align-middle text-[10px] font-bold uppercase text-brand">auto</span>}
                </span>
              );
              // Itens automáticos: somente leitura. Itens manuais: clicáveis.
              return auto ? (
                <div key={item.id} className="flex items-start gap-2">
                  {circle}
                  {text}
                </div>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-start gap-2 text-left"
                  aria-pressed={checked}
                >
                  {circle}
                  {text}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
