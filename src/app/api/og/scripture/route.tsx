import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  let reference = searchParams.get('reference') ?? '2 Corinthians 5:17'
  let text =
    searchParams.get('text') ??
    'Therefore, if anyone is in Christ, the new creation has come.'
  let translation = searchParams.get('translation') ?? 'NIV'

  if (id && id !== 'fallback') {
    const scripture = await db.scripture.findUnique({ where: { id } })
    if (scripture) {
      reference = scripture.reference
      text = scripture.text
      translation = scripture.translation
    }
  }

  const displayText = text.length > 180 ? `${text.slice(0, 177)}…` : text

  const fontRes = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff',
  )
  const fontData = await fontRes.arrayBuffer()

  const svg = await satori(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '3px',
            background: '#C9A84C',
            marginBottom: '40px',
          }}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: '36px',
              color: '#FAFAFA',
              lineHeight: 1.6,
              fontWeight: 300,
              fontStyle: 'italic',
              marginBottom: '32px',
              fontFamily: 'Inter',
            }}
          >
            {`"${displayText}"`}
          </p>
          <p
            style={{
              fontSize: '20px',
              color: '#C9A84C',
              fontWeight: 600,
              letterSpacing: '0.05em',
              fontFamily: 'Inter',
            }}
          >
            {`${reference} (${translation})`}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(201,168,76,0.3)',
            paddingTop: '24px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: '0.2em',
              fontFamily: 'Inter',
              fontWeight: 600,
            }}
          >
            ROOM FOR YOU · WITH YADAH
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(201,168,76,0.4)',
              letterSpacing: '0.15em',
              fontFamily: 'Inter',
            }}
          >
            RFYGLOBAL.ORG
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: fontData, weight: 400, style: 'normal' }],
    },
  )

  const resvg = new Resvg(svg)
  const png = resvg.render().asPng()

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
