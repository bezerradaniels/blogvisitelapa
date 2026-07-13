export default function ComercialLoading() {
  return (
    <div aria-label="Carregando área comercial" aria-busy="true" className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-52 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-surface" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="card-base h-28 animate-pulse bg-surface" />
        ))}
      </div>
    </div>
  );
}
