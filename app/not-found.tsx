import Button from '@/components/Button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
      <p className="font-headline text-sm font-extrabold uppercase tracking-wide text-brand">Erro 404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-title md:text-3xl">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        O endereço pode estar incorreto ou o conteúdo pode ter sido removido.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button href="/">Voltar ao início</Button>
        <Button href="/noticias" variant="outline">Ver notícias</Button>
      </div>
    </div>
  );
}
