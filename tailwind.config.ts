import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#141414',
          soft: '#1C1C1C',
          muted: '#242424',
          border: '#2A2A2A',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          soft: '#FAF7F2',
          muted: '#EDE8DF',
          border: '#E0D9CE',
        },
        gold: {
          DEFAULT: '#D4A847',
          light: '#E8C068',
          dark: '#B8902E',
          electric: '#F0BC4A',
          glow: 'rgba(212,168,71,0.15)',
        },
        red: {
          brand: '#D0021B',
        },
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['General Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(3.5rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(2.5rem, 7vw, 6rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        lg: '8px',
      },
      animation: {
        'gold-pulse': 'goldPulse 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'slide-in-right': 'slideInRight 0.4s ease forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        goldPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
