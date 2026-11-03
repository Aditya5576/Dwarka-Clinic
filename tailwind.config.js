/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'clinic-bg': '#0F1316',
        'clinic-card': '#171C21',
        'clinic-elevated': '#1F262D',
        'clinic-input': '#1A2027',
        'clinic-gold': '#C5A028',
        'clinic-gold-hover': '#B38F1E',
        'clinic-gold-border': '#8C701B',
        'clinic-gold-light': '#FBF7EE',
        'clinic-gold-soft': '#E6D385',
        'clinic-dark': '#12161A',
        'clinic-slate': '#1E252B',
        clinic: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'gold-shimmer': 'gold-shimmer 2.5s ease infinite',
        'fade-out': 'fade-out 0.4s ease-out forwards'
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' }
        },
        'gold-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'fade-out': {
          '0%': { opacity: '1', visibility: 'visible' },
          '100%': { opacity: '0', visibility: 'hidden' }
        }
      }
    },
  },
  plugins: [],
}
