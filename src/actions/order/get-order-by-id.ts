'use server'

import { getCurrentUser } from "@/lib/authorization";
import prisma from "@/lib/prisma";

export const getOrderById = async( id: string ) => {
    const user = await getCurrentUser();

    if(!user) {
      return {
        ok: false,
        message: 'Debe estar autenticado'
      }
    }

    try {
      const order = await prisma.order.findUnique({
        where: {id},
        include: {
            OrderAddress: true,
            OrderItem: {
                select: {
                    price: true,
                    quantity: true,
                    size: true,

                    product: {
                        select: {
                            title: true,
                            slug: true,

                            ProductImage: {
                                select: {
                                    url: true
                                },
                                take: 1
                            }
                        }
                    }
                }
            }
        }
      });

      if(! order ) throw `${id} no existe`;

      if( user.role !== 'admin') {
        if( user.id !== order.userId) {
            throw `${ id } no es de ese usuario`
        }
      }

      return {
        ok: true,
        order: order,
      }

    } catch (error) {
        console.log(error)
      return {
        ok: false,
        message: 'Orden no existe'
      }
    }

  }