/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zamex: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36aaf6',
          500: '#0c8ee7',
          600: '#0070c5',
          700: '#0159a0',
          800: '#064c84',
          900: '#0b406e',
          950: '#072849',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 40px -10px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.04)',
        'modal': '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
        'premium': '0 1px 2px rgba(0,0,0,0.1), 0 8px 16px -4px rgba(0,0,0,0.1)',
        'premium-hover': '0 1px 2px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.2)',
        'bento': '0 1px 3px rgba(0,0,0,0.02), 0 10px 40px -10px rgba(0,0,0,0.04)',
        'bento-hover': '0 1px 3px rgba(0,0,0,0.02), 0 20px 60px -10px rgba(0,0,0,0.08)',
        'glow-blue': '0 0 30px rgba(59, 130, 246, 0.2)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glow-sm': '0 0 15px rgba(59, 130, 246, 0.1)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
