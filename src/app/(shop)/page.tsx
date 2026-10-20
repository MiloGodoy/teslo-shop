
export const revalidate = 60; // 60 segundos

import { getPaginatedProductsWithImages } from "@/actions";
import { Pagination, ProductGrid, Title } from "@/components";

interface Props {
  searchParams: Promise<{
    page?: string;
  }>
}



export default async function Home({ searchParams }: Props) {

  const query = await searchParams;
  const page = query.page ? parseInt(query.page) : 1;

  const { products, currentPage, totalPages } = await getPaginatedProductsWithImages({ page });



  return (
    <>
      <Title
        title="Tienda"
        subtitle="Todos los productos"
        className="mb-2"
      />

      {products.length === 0 && <p className="my-8">No hay productos para mostrar.</p>}
      <ProductGrid
        products={ products }
      />

      <Pagination totalPages={ totalPages }/>
    </>
  );
}
