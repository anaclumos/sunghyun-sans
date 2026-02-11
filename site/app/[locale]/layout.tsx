import type {Viewport} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Navigation} from '@/components/navigation';
import {Footer} from '@/components/footer';
import {MotionProvider} from '@/components/motion-provider';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export const viewport: Viewport = {
  themeColor: '#10b981',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

function getMetadataBase() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';

  const normalizedBase = base.startsWith('http') ? base : `https://${base}`;
  return new URL(normalizedBase);
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});
  return {
    metadataBase: getMetadataBase(),
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    other: {
      'msapplication-TileColor': '#10b981',
    },
  };
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const navT = await getTranslations({locale, namespace: 'Nav'});

  return (
    <html lang={locale} className="scroll-smooth">
      <body className="font-sans antialiased bg-white text-ink overflow-x-hidden">
        <NextIntlClientProvider>
          <MotionProvider>
            <a href="#main-content" className="skip-link">
              {navT('skipToContent')}
            </a>
            <Navigation />
            {children}
            <Footer />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
