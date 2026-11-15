import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          DEFAULT: '#059669', // Emerald Green - MeeshoMart signature
          dark: '#047857',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
