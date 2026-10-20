'use server'

import prisma from "@/lib/prisma"
import { Gender, Prisma } from "@prisma/client";

interface PaginationOptions {
    page?: number;
    take?: number;
    gender?: Gender;
    search?: string;
}

export const getPaginatedProductsWithImages = async({
    page = 1,
    take = 12,
    gender,
    search,
}: PaginationOptions) => {

    if (!Number.isFinite(page)) page = 1;
    if ( page < 1) page = 1;
    page = Math.floor(page);
    take = Number.isInteger(take) && take > 0 ? Math.min(take, 100) : 12;
    const term = search?.trim().slice(0, 120);
    const where: Prisma.ProductWhereInput = {
        gender,
        ...(term ? {
            OR: [
                { title: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { tags: { has: term.toLowerCase() } },
            ],
        } : {}),
    };

    try {

        // 1. Obtener los productos
        const products = await prisma.product.findMany({
            take,
            orderBy: { title: 'asc' },
            skip: ( page - 1 ) * take,
            include: {
                ProductImage: {
                    orderBy: { id: 'asc' },
                    take: 2,
                    select: {
                        url: true
                    },
                },
            },
            //! Por género
            where,
        });

        // 2. Obtener el total de páginas
        const totalCount = await prisma.product.count({
            where,
        });
        const totalPages = Math.ceil( totalCount / take );


        return {
            currentPage: page,
            totalPages: totalPages,
            products: products.map( product => ({
                ...product,
                images: product.ProductImage.map( image => image.url )
            }))
        }

    } catch (error) {
        throw new Error('No se pudo cargar los productos');
    }
}
