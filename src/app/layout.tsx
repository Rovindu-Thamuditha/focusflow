import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { TimerProvider } from '@/context/timer-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BottomNav } from '@/components/bottom-nav';
import { syncOfflineFeedback } from '@/lib/feedback-manager';
import { OfflineBanner } from '@/components/offline-banner';
import { UpdateModal } from '@/components/update-modal';

import 'katex/dist/katex.min.css';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'FocusFlow',
  description: 'Track your focus and conquer your day.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FocusFlow',
  },
};

export const viewport: Viewport = {
  themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#212529' },
  ],
  viewportFit: 'cover',
}

// Global sync trigger for offline feedback
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineFeedback);
  // Attempt a sync on initial load as well, in case the app was closed while offline
  syncOfflineFeedback();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head/>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <FirebaseClientProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
              <TooltipProvider>
                <TimerProvider>
                  <div className="relative flex min-h-screen flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
                    <OfflineBanner />
                    <UpdateModal />
                    {children}
                  </div>
                  <BottomNav />
                </TimerProvider>
              </TooltipProvider>
              <Toaster />
            </ThemeProvider>
        </FirebaseClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
