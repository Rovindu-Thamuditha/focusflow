
import type { Metadata } from 'next';
import { Inter, Cinzel_Decorative } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SpeedInsights } from '@vercel/speed-insights/next';


import 'katex/dist/katex.min.css';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel-decorative',
});

export const metadata: Metadata = {
  title: 'GridFocus',
  description: 'Track your focus and conquer your day.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          cinzelDecorative.variable
        )}
      >
        <FirebaseClientProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
                <Toaster />
            </ThemeProvider>
        </FirebaseClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

    