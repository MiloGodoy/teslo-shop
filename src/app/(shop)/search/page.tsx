import type { Metadata } from 'next';
import { getPaginatedProductsWithImages } from '@/actions/product/product-pagination';
import { Pagination, ProductGrid, Title } from '@/components';

export const metadata: Metadata = { title: 'Buscar productos' };

interface Props {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (typeof params.q === 'string' ? params.q : '').trim().slice(0, 120);
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const results = query ? await getPaginatedProductsWithImages({ search: query, page }) : null;

  return (
    <>
      <Title title="Buscar productos" subtitle="Encuentra productos por nombre, descripción o etiqueta" />
      <form action="/search" method="get" role="search" aria-label="Buscar en el catálogo"
        className="flex flex-col sm:flex-row gap-3 mb-8">
        <label htmlFor="product-search" className="sr-only">Buscar productos</label>
        <input id="product-search" name="q" type="search" defaultValue={query} maxLength={120}
          placeholder="¿Qué estás buscando?" className="p-3 border rounded-md flex-1" />
        <button type="submit" className="btn-primary">Buscar</button>
      </form>

      {!results ? (
        <p className="my-8">Escribe un término para buscar en el catálogo.</p>
      ) : results.products.length === 0 ? (
        <p className="my-8" role="status">No encontramos productos para «{query}».</p>
      ) : (
        <>
          <p className="mb-5">Resultados para «{query}»</p>
          <ProductGrid products={results.products} />
          <Pagination totalPages={results.totalPages} />
        </>
      )}
    </>
  );
}
