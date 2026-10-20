'use client';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPaypalOrder } from '@/actions/payments/create-paypal-order';
import { paypalCheckPayment } from '@/actions/payments/paypal-check-payment';

export function PayPalButton({ orderId }: { orderId: string; amount: number }) {
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return <p role="status">Los pagos todavía no están configurados.</p>;
  }
  return <ConfiguredPayPalButton orderId={orderId} />;
}

function ConfiguredPayPalButton({ orderId }: { orderId: string }) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string>();
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  async function confirm(id: string) {
    setChecking(true);
    try {
      const result = await paypalCheckPayment(id);
      if (!result.ok) setMessage(result.message ?? 'No se pudo confirmar el pago.');
      else { setMessage('Pago confirmado.'); router.refresh(); }
    } catch { setMessage('No se pudo verificar. Vuelve a intentar.'); }
    finally { setChecking(false); }
  }
  if (isPending) return <p>Cargando PayPal…</p>;
  return <div>
    <PayPalButtons
      createOrder={async () => {
        setMessage('');
        const result = await createPaypalOrder(orderId);
        if (!result.ok) { setMessage(result.message); throw new Error(result.message); }
        setTransactionId(result.transactionId);
        return result.transactionId;
      }}
      onApprove={async (data) => { setTransactionId(data.orderID); await confirm(data.orderID); }}
      onError={() => setMessage('PayPal no pudo completar la operación. Si ya pagaste, usa Verificar pago.')}
    />
    <p role="status">{message}</p>
    {transactionId && <button type="button" className="btn-secondary" disabled={checking}
      onClick={() => confirm(transactionId)}>{checking ? 'Verificando…' : 'Verificar pago'}</button>}
  </div>;
}
