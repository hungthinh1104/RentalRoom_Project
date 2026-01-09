import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from '@/components/landing/providers';
import { AIChatWidget } from '@/features/ai/components/ai-chat-widget';
import { Toaster } from 'sonner';
import { OfflineBanner } from '@/components/offline-banner';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rental Room",
  description: "Rental Room Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            <OfflineBanner />
            {children}
            <AIChatWidget />
            <Toaster position="top-right" richColors />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
