import "./globals.css";
import Script from 'next/script';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from '@vercel/speed-insights/react';

export const metadata = {
  title: 'Sunghyun Sans',
  description: 'An open-source alternative to SF Pro Rounded',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@v1.0.0/dist/web/css/sunghyun-sans-dynamic-subset.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@v1.0.0/dist/web/css/sunghyun-sans-kr-dynamic-subset.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@v1.0.0/dist/web/css/sunghyun-sans-jp-dynamic-subset.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@v1.0.0/dist/web/css/sunghyun-sans-disambiguated-dynamic-subset.min.css" />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Script src="https://cdn.visitors.now/v.js" data-token="850b7c05-9254-4a71-9631-32865ae1daf2" />
      </body>
    </html>
  );
}
