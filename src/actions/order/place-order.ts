'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
import { addressSchema, orderItemsSchema } from '@/lib/validation';
import { calculateTotals } from '@/utils/order-totals';
import type { Address, Size } from '@/interfaces';

export async function placeOrder(productIds: { productId: string; quantity: number; size: Size }[], address: Address) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: 'Debes iniciar sesión.' };
  const items = orderItemsSchema.safeParse(productIds);
  const delivery = addressSchema.safeParse(address);
  if (!items.success || !delivery.success) return { ok: false as const, message: 'Revisa los productos y la dirección.' };
  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.data.map((item) => item.productId) } },
      });
      const details = items.data.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product || !product.sizes.includes(item.size)) throw new Error('Un producto o talle ya no está disponible.');
        return { ...item, price: product.price };
      });
      // Aggregate sizes and use a conditional write to protect concurrent orders.
      for (const product of [...products].sort((a, b) => a.id.localeCompare(b.id))) {
        const quantity = details.filter((item) => item.productId === product.id)
          .reduce((sum, item) => sum + item.quantity, 0);
        const stock = await tx.product.updateMany({
          where: { id: product.id, inStock: { gte: quantity } },
          data: { inStock: { decrement: quantity } },
        });
        if (stock.count !== 1) throw new Error('No hay inventario suficiente. Actualiza el carrito.');
      }
      const { country, ...orderAddress } = delivery.data;
      return tx.order.create({
        data: {
          userId: user.id,
          ...calculateTotals(details),
          itemsInOrder: details.reduce((sum, item) => sum + item.quantity, 0),
          OrderItem: { create: details },
          OrderAddress: { create: { ...orderAddress, countryId: country } },
        },
      });
    });
    return { ok: true as const, order };
  } catch (error) {
    const message = error instanceof Error && [
      'Un producto o talle ya no está disponible.',
      'No hay inventario suficiente. Actualiza el carrito.',
    ].includes(error.message) ? error.message : 'No se pudo crear la orden. Revisa la dirección y vuelve a intentar.';
    return { ok: false as const, message };
  }
}
