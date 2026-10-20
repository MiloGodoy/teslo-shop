'use server'

import { getCurrentUser } from "@/lib/authorization"
import prisma from "@/lib/prisma";

export const getPaginatedOrders =  async() => {
    const user = await getCurrentUser();

    if( user?.role !== 'admin' ) {
        return {
            ok: false,
            message: 'Debe estar autenticado'
        }
    }

    const orders = await prisma.order.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            OrderAddress: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    })

    return {
        ok: true,
        orders: orders,
    }
}