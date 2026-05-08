import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'Room For You'
  const subtitle = searchParams.get('subtitle') ?? 'A Christian Community with Minister Yadah'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0F0F0F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)',
            display: 'flex',
          }}
        />
        <p
          style={{
            color: '#C9A84C',
            fontSize: '14px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: '0 0 20px 0',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          ROOM FOR YOU · RFYGLOBAL.ORG
        </p>
        <h1
          style={{
            color: '#F8F8F8',
            fontSize: title.length > 40 ? '52px' : '68px',
            fontWeight: 700,
            lineHeight: 1.1,
            margin: '0 0 20px 0',
            maxWidth: '800px',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: 'rgba(248,248,248,0.6)',
            fontSize: '24px',
            margin: 0,
            fontFamily: 'Arial, sans-serif',
            maxWidth: '700px',
          }}
        >
          {subtitle}
        </p>
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px',
          }}
        >
          <p
            style={{
              color: '#C9A84C',
              fontSize: '13px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: 0,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Minister Yadah
          </p>
          <p
            style={{
              color: 'rgba(201,168,76,0.5)',
              fontSize: '11px',
              margin: 0,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Jesus to Nations — 2 Cor 5:17-21
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
