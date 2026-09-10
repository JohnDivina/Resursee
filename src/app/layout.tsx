import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { SoundProvider } from '@/components/sound/SoundProvider';
import SessionTimeoutProvider from '@/components/auth/SessionTimeoutProvider';

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
  icons: {
    icon: [
      { url: '/favicon.svg?v=4', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=4', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=4',
    apple: [{ url: '/apple-touch-icon.png?v=4', sizes: '180x180' }],
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
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.svg?v=4" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico?v=4" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" sizes="180x180" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('resursee-theme');
                  var theme = saved ? saved : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased selection:bg-blue-500/20 selection:text-blue-900 dark:selection:bg-white/20 dark:selection:text-white font-sans">
        <ThemeProvider>
          <SoundProvider>
            <SessionTimeoutProvider>
              {children}
            </SessionTimeoutProvider>
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
