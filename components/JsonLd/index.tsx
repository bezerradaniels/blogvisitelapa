// Injeta dados estruturados (JSON-LD) de forma segura.
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // O conteúdo vem de geradores internos (não de input do usuário).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
