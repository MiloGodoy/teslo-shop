import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { paypalRequest, reconcilePaypalPayment } from '@/lib/paypal';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return NextResponse.json({ error: 'Webhook no configurado' }, { status: 503 });
  try {
    const event = await request.json();
    const headers = request.headers;
    const verification = await paypalRequest('/v1/notifications/verify-webhook-signature', 'POST', {
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: webhookId, webhook_event: event,
    }) as { verification_status?: string };
    if (verification.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
    }
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const id = event.resource?.supplementary_data?.related_ids?.order_id;
      if (typeof id !== 'string') return NextResponse.json({ error: 'Orden ausente' }, { status: 400 });
      const orderId = await reconcilePaypalPayment(id);
      revalidatePath(`/orders/${orderId}`);
    }
    return NextResponse.json({ received: true });
  } catch {
    // Non-2xx tells PayPal to retry transient reconciliation failures.
    return NextResponse.json({ error: 'No se pudo verificar el evento' }, { status: 500 });
  }
}
