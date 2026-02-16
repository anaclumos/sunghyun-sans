import "./globals.css";

// Root layout is a pass-through — the [locale] layout provides <html> and <body>.
// See: https://next-intl.dev/docs/routing/middleware
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
