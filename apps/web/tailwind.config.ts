import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: '#17202a',
        mist: '#eef4f7',
        teal: '#0f766e',
        coral: '#e76f51',
        amber: '#f4a261',
        sage: '#6a994e'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(23, 32, 42, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config
