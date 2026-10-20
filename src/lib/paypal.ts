import { z } from 'zod';
import prisma from '@/lib/prisma';

export const paypalOrderSchema = z.object({
  id: z.string(), status: z.string(),
  purchase_units: z.array(z.object({
    invoice_id: z.string(),
    amount: z.object({ currency_code: z.string(), value: z.string() }),
    payee: z.object({ merchant_id: z.string().optional() }).optional(),
    payments: z.object({ captures: z.array(z.object({
      status: z.string(), amount: z.object({ currency_code: z.string(), value: z.string() }),
    })).optional() }).optional(),
  })),
});
export type PaypalOrder = z.infer<typeof paypalOrderSchema>;

function paypalBase() {
  const env = process.env.PAYPAL_ENVIRONMENT ?? 'sandbox';
  if (!['sandbox', 'live'].includes(env)) throw new Error('PAYPAL_ENVIRONMENT inválido.');
  return env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export async function paypalRequest(path: string, method = 'GET', body?: unknown, requestId?: string): Promise<unknown> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error('Configura las credenciales de PayPal.');
  const tokenResponse = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!tokenResponse.ok) throw new Error('No se pudo autenticar con PayPal.');
  const token = await tokenResponse.json();
  if (typeof token.access_token !== 'string') throw new Error('Respuesta de PayPal inválida.');
  const response = await fetch(`${paypalBase()}${path}`, {
    method, cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error('PayPal no pudo procesar la solicitud.');
  return response.json();
}

export function paymentMatchesOrder(payment: PaypalOrder, order: { id: string; total: number; transactionId: string | null }, merchantId?: string) {
  const unit = payment.purchase_units[0];
  if (payment.id !== order.transactionId || payment.status !== 'COMPLETED' ||
      payment.purchase_units.length !== 1 || !unit || unit.invoice_id !== order.id ||
      unit.amount.currency_code !== 'USD' || !/^\d+\.\d{2}$/.test(unit.amount.value) ||
      Math.round(Number(unit.amount.value) * 100) !== Math.round(order.total * 100)) return false;
  if (merchantId && unit.payee?.merchant_id !== merchantId) return false;
  const captures = unit.payments?.captures;
  if (!captures?.length || captures.some((c) => c.status !== 'COMPLETED' || c.amount.currency_code !== 'USD' ||
      !/^\d+\.\d{2}$/.test(c.amount.value))) return false;
  return captures.reduce((sum, c) => sum + Math.round(Number(c.amount.value) * 100), 0) === Math.round(order.total * 100);
}

export async function reconcilePaypalPayment(transactionId: string) {
  const parsed = paypalOrderSchema.safeParse(await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(transactionId)}`));
  if (!parsed.success) throw new Error('Respuesta de pago inválida.');
  const payment = parsed.data;
  const id = payment.purchase_units[0]?.invoice_id;
  if (!id) throw new Error('Pago sin orden asociada.');
  const order = await prisma.order.findUnique({ where: { id } });
  const merchantId = process.env.PAYPAL_MERCHANT_ID;
  if (process.env.PAYPAL_ENVIRONMENT === 'live' && !merchantId) throw new Error('Configura PAYPAL_MERCHANT_ID para pagos reales.');
  if (!order || !paymentMatchesOrder(payment, order, merchantId)) throw new Error('El pago no coincide con la orden.');
  await prisma.order.updateMany({
    where: { id, transactionId, isPaid: false }, data: { isPaid: true, paidAt: new Date() },
  });
  return id;
}
