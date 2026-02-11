import type {Viewport} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {SITE_URL} from '@/lib/constants';
import {ThemeProvider} from '@/components/theme-provider';
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

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Metadata'});
  const localePath = locale === routing.defaultLocale ? '' : `/${locale}`;
  const canonicalUrl = `${SITE_URL}${localePath}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          `${SITE_URL}${l === routing.defaultLocale ? '' : `/${l}`}`,
        ])
      ),
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonicalUrl,
      siteName: 'Sunghyun Sans',
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
    <html lang={locale} className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans antialiased bg-paper text-ink overflow-x-hidden">
        <NextIntlClientProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <MotionProvider>
              <a href="#main-content" className="skip-link">
                {navT('skipToContent')}
              </a>
              <Navigation />
              {children}
              <Footer />
            </MotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
