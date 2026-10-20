'use client';
import { SessionProvider } from 'next-auth/react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const content = <SessionProvider>{children}</SessionProvider>;
  return clientId ? <PayPalScriptProvider options={{ clientId, intent: 'capture', currency: 'USD' }}>
    {content}
  </PayPalScriptProvider> : content;
};
