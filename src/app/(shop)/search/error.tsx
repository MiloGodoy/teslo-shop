'use client';

export default function SearchError({ reset }: { reset: () => void }) {
  return (
    <div className="my-12">
      <h1 className="text-2xl font-bold mb-3">No pudimos realizar la búsqueda</h1>
      <p className="mb-5">Vuelve a intentarlo en unos momentos.</p>
      <button type="button" className="btn-primary" onClick={reset}>Reintentar</button>
    </div>
  );
}
