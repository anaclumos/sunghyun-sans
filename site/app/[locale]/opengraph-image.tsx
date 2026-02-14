import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

export const alt = 'Sunghyun Sans - SF Pro Rounded for Everyone';
export const size = {
  width: 2400,
  height: 1260,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const validLocale = ['en', 'kr', 'jp'].includes(locale) ? locale : 'en';
  const buffer = await readFile(
    join(process.cwd(), 'public/og', `${validLocale}.png`)
  );

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
