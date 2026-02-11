import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Sunghyun Sans - SF Pro Rounded for Everyone'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const content: Record<string, { title: string; subtitle: string }> = {
  en: {
    title: 'Sunghyun Sans',
    subtitle: 'SF Pro Rounded for Everyone',
  },
  kr: {
    title: '성현 산스',
    subtitle: '모두를 위한 SF Pro Rounded',
  },
  jp: {
    title: 'ソンヒョン サンス',
    subtitle: 'すべての人のための SF Pro Rounded',
  },
}

const fontFiles: Record<string, { regular: string; bold: string }> = {
  en: {
    regular: 'SunghyunSans-Regular.otf',
    bold: 'SunghyunSans-Bold.otf',
  },
  kr: {
    regular: 'SunghyunSansKR-Regular.otf',
    bold: 'SunghyunSansKR-Bold.otf',
  },
  jp: {
    regular: 'SunghyunSansJP-Regular.otf',
    bold: 'SunghyunSansJP-Bold.otf',
  },
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = content[locale] ?? content.en
  const files = fontFiles[locale] ?? fontFiles.en

  const fontRegular = await readFile(
    join(process.cwd(), 'public/fonts', files.regular)
  )
  const fontBold = await readFile(
    join(process.cwd(), 'public/fonts', files.bold)
  )

  return new ImageResponse(
    (
      <div
        style={{
          background: '#d1fae5',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontFamily: '"Sunghyun Sans"',
            fontWeight: 700,
            color: '#10b981',
            letterSpacing: '-0.04em',
            marginBottom: 24,
          }}
        >
          {t.title}
        </div>

        <div
          style={{
            fontSize: 70,
            fontFamily: '"Sunghyun Sans"',
            fontWeight: 400,
            color: '#10b981',
            letterSpacing: '-0.02em',
          }}
        >
          {t.subtitle}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Sunghyun Sans',
          data: fontRegular,
          style: 'normal' as const,
          weight: 400 as const,
        },
        {
          name: 'Sunghyun Sans',
          data: fontBold,
          style: 'normal' as const,
          weight: 700 as const,
        },
      ],
    }
  )
}
