import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SoundProvider } from '@/components/sound/SoundProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Resursee · Central University Resource Hub',
  description:
    'The centralized discovery platform for official university forms, templates, policies, guidelines, announcements, and campus updates.',
  keywords: [
    'University Resources',
    'University Forms',
    'Official Templates',
    'Campus Policies',
    'University Hub',
    'Resursee',
  ],
  authors: [{ name: 'University Central Resource Hub' }],
  openGraph: {
    title: 'Resursee · Central University Resource Hub',
    description:
      'Search, find, and download official university forms, templates, policies, and news in seconds.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased selection:bg-blue-500/20 selection:text-blue-900 font-sans">
        <ThemeProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
