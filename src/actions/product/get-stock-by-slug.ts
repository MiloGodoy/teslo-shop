
'use server'

import prisma from "@/lib/prisma";
import { formatDatabaseError } from '@/lib/database-error';
//import { sleep } from "@/utils";

export const getStockBySlug = async( slug: string ): Promise<number> => {

    try {

       // await sleep(3);

        const stock = await prisma.product.findFirst({
            where: { slug },
            select: { inStock: true}
        })

        return stock?.inStock ?? 0;
        
        
    } catch (error) {
        console.error(formatDatabaseError('product.getStock', error));
        return 0;
    }
}
