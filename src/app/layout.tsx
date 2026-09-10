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
  title: {
    default: 'Resursee',
    template: '%s · Resursee',
  },
  description:
    'The centralized platform for developer tools, public APIs, GitHub repositories, and intelligent client-side utilities.',
  keywords: [
    'Developer Tools',
    'Public APIs',
    'GitHub Repositories',
    'Productivity Tools',
    'Resursee',
  ],
  authors: [{ name: 'John Rey Divina' }],
  openGraph: {
    title: 'Resursee',
    description:
      'The centralized platform for developer tools, public APIs, GitHub repositories, and intelligent client-side utilities.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=5', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=5', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.svg?v=5', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=5', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=5',
    apple: [{ url: '/apple-touch-icon.png?v=5', sizes: '180x180' }],
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
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=5" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=5" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=5" />
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
      <body className="min-h-full flex flex-col antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 font-sans">
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
