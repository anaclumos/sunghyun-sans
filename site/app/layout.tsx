import "./globals.css";
import Script from 'next/script';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
      <Script src="https://cdn.visitors.now/v.js" data-token="850b7c05-9254-4a71-9631-32865ae1daf2" />
    </>
  );
}
