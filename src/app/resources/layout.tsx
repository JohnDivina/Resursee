import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public APIs Directory · 1,760+ Developer APIs | Resursee',
  description:
    'Explore, search, and filter over 1,760 curated public APIs across 51 categories for web developers, machine learning engineers, and software architects. Includes Grid and List views, authentication requirements, CORS status, and direct documentation links.',
  keywords: [
    'Public APIs',
    'Developer APIs',
    'Free APIs',
    'API Directory',
    'REST APIs',
    'Public APIs List',
    'Developer Tools',
    'Resursee',
  ],
  openGraph: {
    title: 'Public APIs Directory · 1,760+ Developer APIs | Resursee',
    description:
      'Search and discover 1,760+ usable public APIs across 51 categories with authentication filters, CORS indicators, and Grid/List view options.',
    type: 'website',
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
