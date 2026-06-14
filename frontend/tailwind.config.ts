import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0EA5E9',
          50: '#effaff',
          100: '#dff5ff',
          200: '#b8ebff',
          300: '#7edcff',
          400: '#38c7ff',
          500: '#0EA5E9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(14, 165, 233, 0.18)'
      }
    }
  },
  plugins: []
} satisfies Config;