'use server'

import prisma from "@/lib/prisma";
import { formatDatabaseError } from '@/lib/database-error';

export const getProductBySlug = async( slug: string ) => {

    try {

        const product = await prisma.product.findFirst({
            include: {
                ProductImage: { orderBy: { id: 'asc' } }
            },
            where: {
                slug: slug,
            }
        })

        if ( !product ) return null;

        return {
            ...product,
            images: product.ProductImage.map( image => image.url )
        }

    } catch (error) {
        console.error(formatDatabaseError('product.getBySlug', error));
        throw new Error('Error al obtener producto por slug');
    }
}
