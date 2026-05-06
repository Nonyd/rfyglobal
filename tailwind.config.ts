import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#0A0A0A',
          soft: '#111111',
          muted: '#1A1A1A',
        },
        white: {
          DEFAULT: '#FAFAFA',
          soft: '#F0F0F0',
          muted: '#E0E0E0',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          dark: '#A8892F',
          glow: 'rgba(201,168,76,0.15)',
        },
        red: {
          brand: '#D0021B',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      animation: {
        'gold-shimmer': 'goldShimmer 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        goldShimmer: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
          '50%': { boxShadow: '0 0 24px 4px rgba(201,168,76,0.25)' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
