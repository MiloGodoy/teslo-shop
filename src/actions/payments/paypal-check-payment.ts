'use server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
import { paypalRequest, reconcilePaypalPayment } from '@/lib/paypal';
import { revalidatePath } from 'next/cache';

export async function paypalCheckPayment(transactionId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Debes iniciar sesión.' };
  try {
    const order = await prisma.order.findFirst({ where: { transactionId, userId: user.id } });
    if (!order) return { ok: false, message: 'La transacción no pertenece a tu cuenta.' };
    if (order.isPaid) return { ok: true };
    // Idempotent capture; a webhook or earlier response may already have captured it.
    try { await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(transactionId)}/capture`, 'POST', {}, `capture-${order.id}`); }
    catch { /* Fetch and verify the actual payment state below. */ }
    const id = await reconcilePaypalPayment(transactionId);
    revalidatePath(`/orders/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No se pudo confirmar el pago. Puedes volver a verificarlo sin pagar otra vez.' };
  }
}
