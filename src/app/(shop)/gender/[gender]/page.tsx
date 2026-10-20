
export const revalidate = 60; // 60 segundos

import { getPaginatedProductsWithImages } from "@/actions";
import { Pagination, ProductGrid, Title } from "@/components";

import { Gender } from "@prisma/client";
import { notFound } from "next/navigation";


interface Props {
  params: Promise<{ gender: string; }>
  searchParams: Promise<{
      page?: string;
    }>
}


export default async function GenderByPage({ params, searchParams }: Props ) {

  const { gender } = await params;
  if (!Object.values(Gender).includes(gender as Gender)) notFound();

  const query = await searchParams;
  const page = query.page ? parseInt(query.page) : 1;

  const { products, currentPage, totalPages } = await getPaginatedProductsWithImages({
    page,
    gender: gender as Gender,
});


  const labels: Record<string, string> = {
    'men': 'para hombres',
    'women': 'para mujeres',
    'kid': 'para niños',
    'unisex': 'para todos'

  }

  // if( id === 'kids' ) {
  //   notFound();
  //   return
  // }



  return (
    <>
      <Title
        title={`Artículos ${ labels[gender] }`}
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
