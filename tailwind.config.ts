import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fefdf9',
          100: '#fdfbf2',
          200: '#fdf4e0',
          300: '#fce4bf',
          400: '#fac97d',
          500: '#f7a935',
          600: '#f59e0b',
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          900: '#0f172a',
        },
        teal: {
          50: '#f0fdfa',
          500: '#14b8a6',
          600: '#0d9488',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: ['Consolas', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
export default config
