/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7ff',
          300: '#a5baff',
          400: '#8299ff',
          500: '#6470f3',
          600: '#4f52e8',
          700: '#4140cc',
          800: '#3535a6',
          900: '#2e3183',
          950: '#1c1e50',
        },
        surface: {
          DEFAULT: '#0f1117',
          50:  '#1a1d27',
          100: '#1e2130',
          200: '#252838',
          300: '#2e3245',
        },
        accent: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          pink: '#ec4899',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6470f3 0%, #a855f7 100%)',
        'gradient-surface': 'linear-gradient(180deg, #1a1d27 0%, #0f1117 100%)',
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(100, 112, 243, 0.3)',
        'glow-sm': '0 0 10px rgba(100, 112, 243, 0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
