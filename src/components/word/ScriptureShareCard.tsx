'use client'

import { forwardRef } from 'react'

interface ScriptureShareCardProps {
  reference: string
  text: string
  translation: string
}

export const ScriptureShareCard = forwardRef<HTMLDivElement, ScriptureShareCardProps>(
  ({ reference, text, translation }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1080px',
          height: '1080px',
          background: '#F5F0E8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: '80px',
            right: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#1A1714',
                letterSpacing: '0.1em',
                margin: 0,
                lineHeight: 1,
              }}
            >
              ROOM FOR YOU
            </p>
            <p
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#C9A84C',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                margin: '4px 0 0 0',
              }}
            >
              rfyglobal.org
            </p>
          </div>
          <p
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              color: '#9A8F84',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Daily Word
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '860px',
          }}
        >
          <p
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              color: '#C9A84C',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              margin: '0 0 24px 0',
            }}
          >
            {translation}
          </p>

          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '48px',
              fontWeight: '700',
              color: '#1A1714',
              margin: '0 0 32px 0',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {reference}
          </p>

          <div
            style={{
              width: '60px',
              height: '2px',
              background: '#C9A84C',
              margin: '0 0 40px 0',
            }}
          />

          <p
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: text.length > 200 ? '26px' : text.length > 120 ? '30px' : '36px',
              fontStyle: 'italic',
              color: '#2C2520',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            &ldquo;{text}&rdquo;
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '80px',
            right: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              color: '#C9A84C',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Jesus to Nations - 2 Cor 5:17-21
          </p>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
          }}
        />
      </div>
    )
  },
)

ScriptureShareCard.displayName = 'ScriptureShareCard'
