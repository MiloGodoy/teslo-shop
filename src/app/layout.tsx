import type { Metadata } from "next";

import "./globals.css";
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/montserrat-alternates/latin-500.css';
import '@fontsource/montserrat-alternates/latin-700.css';
import { inter } from "@/config/fonts";
import { Providers } from "@/components";



export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  title: {
    template: '%s - Teslo | Shop',
    default: 'Home - Teslo | Shop'
  },
  description: "Una tienda virtual de productos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
