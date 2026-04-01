/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        gold: {
          DEFAULT: '#C9A84C',
          light:   '#E8C97A',
          dim:     'rgba(201,168,76,0.12)',
        },
        silver: {
          DEFAULT: '#A8B4C0',
          light:   '#D4DCE4',
        },
        algo: {
          DEFAULT: '#00B4D8',
          dim:     'rgba(0,180,216,0.10)',
        },
        // Surfaces
        surface: {
          base:    '#0B0B0D',
          raised:  '#141416',
          card:    '#181820',
          hover:   '#1E1E28',
        },
        // Semantic
        up:   '#5BAD8A',
        down: '#C45F5F',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body:    ['Crimson Pro', 'Georgia', 'serif'],
        mono:    ['SF Mono', 'Fira Code', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
        gold:    'rgba(201,168,76,0.20)',
        algo:    'rgba(0,180,216,0.20)',
        up:      'rgba(91,173,138,0.30)',
        down:    'rgba(196,95,95,0.30)',
      },
      animation: {
        blink: 'blink 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
