import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        /* Semantic tokens (rgb triplets from globals.css :root / .light) */
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        theme: 'rgb(var(--color-border) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        'red-brand': '#DC2626',
        void: '#0F0F0F',
        ink: '#1A1A1A',
        smoke: '#242424',
        ash: '#2E2E2E',
        snow: '#F8F8F8',
        mist: '#A0A0A0',
        fog: '#585858',
        gold: {
          DEFAULT: '#C9A84C',
          bright: '#E8C96A',
          dim: '#8A6F2E',
          glow: 'rgba(201,168,76,0.12)',
        },
        crimson: {
          DEFAULT: '#8B0000',
          bright: '#A00000',
          dim: '#6B0000',
          glow: 'rgba(139,0,0,0.12)',
        },
        paper: '#F5F0E8',
        parchment: '#EDE7DB',
        cream: {
          DEFAULT: '#F5F0E8',
          soft: '#FAF7F2',
          muted: '#EDE8DF',
          border: '#D8D0C4',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['General Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(3.5rem, 9vw, 8.5rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        title: ['clamp(2.5rem, 6vw, 5.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        heading: ['clamp(1.8rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        subheading: ['clamp(1.2rem, 2.5vw, 2rem)', { lineHeight: '1.2' }],
      },
      animation: {
        breathe: 'breathe 6s ease-in-out infinite',
        'fade-in': 'fadeIn 1s ease forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gold-line': 'goldLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        goldLine: {
          from: { width: '0', opacity: '0' },
          to: { width: '100%', opacity: '1' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
