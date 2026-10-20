'use server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
import { paypalRequest } from '@/lib/paypal';
import { z } from 'zod';

export async function createPaypalOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: 'Debes iniciar sesión.' };
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== user.id || order.isPaid || order.total <= 0) {
      return { ok: false as const, message: 'La orden no está disponible para pago.' };
    }
    if (process.env.PAYPAL_ENVIRONMENT === 'live' && !process.env.PAYPAL_MERCHANT_ID) {
      throw new Error('Missing merchant configuration');
    }
    if (order.transactionId) return { ok: true as const, transactionId: order.transactionId };
    const payment = z.object({ id: z.string() }).parse(await paypalRequest('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE', purchase_units: [{
        invoice_id: order.id,
        amount: { currency_code: 'USD', value: order.total.toFixed(2) },
        ...(process.env.PAYPAL_MERCHANT_ID ? { payee: { merchant_id: process.env.PAYPAL_MERCHANT_ID } } : {}),
      }],
    }, `create-${order.id}`));
    // Concurrent requests cannot replace an existing payment association.
    await prisma.order.updateMany({
      where: { id: order.id, userId: user.id, isPaid: false, transactionId: null },
      data: { transactionId: payment.id },
    });
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    if (!saved.transactionId) throw new Error('Order association failed');
    return { ok: true as const, transactionId: saved.transactionId };
  } catch {
    return { ok: false as const, message: 'No se pudo iniciar PayPal. Revisa sus credenciales y vuelve a intentar.' };
  }
}
