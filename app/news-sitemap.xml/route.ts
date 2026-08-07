// Endpoint legado: o portal não publica mais um sitemap específico de notícias.
export function GET() {
  return new Response(null, {
    status: 410,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
