import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { AuthGuard } from '@/lib/AuthGuard';

export const metadata: Metadata = {
  title: 'zamex.app — Карго удирдлагын систем',
  description: 'Хятад-Монгол карго тээврийн ухаалаг платформ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="icon" href="/favicon.png" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; }`}</style>
      </head>
      <body className="min-h-screen">
        <AuthGuard>
          {children}
        </AuthGuard>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
          }}
        />
      </body>
    </html>
  );
}
