import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import './globals.css';
import ThemeProvider from '@/components/ui/ThemeProvider';
import { ConfirmModalProvider } from '@/components/ui/ConfirmModal';
import { ToastProvider } from '@/components/ui/toast';
import NavigationProgress from '@/components/ui/NavigationProgress';
import HelpFab from '@/components/support/HelpFab';
import CookieConsent from '@/components/legal/CookieConsent';

export const metadata: Metadata = {
  title: 'Eterno Pet — Memória Afetiva para Pets',
  description:
    'Crie um memorial digital delicado e eterno para o seu pet. Registre momentos, histórias e lembranças em um espaço bonito e permanente.',
  keywords: ['memorial pet', 'memória pet', 'homenagem pet', 'pet falecido'],
  openGraph: {
    title: 'Eterno Pet',
    description: 'Um lugar eterno para a memória do seu pet.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <ConfirmModalProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
              <HelpFab />
              <CookieConsent />
            </ToastProvider>
          </ConfirmModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
