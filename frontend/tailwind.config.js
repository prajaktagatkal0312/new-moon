/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        midnight: {
          950: '#070913',
          900: '#0d1127',
          800: '#171e3d',
          700: '#252f5a',
          accent: '#8b5cf6',
          cyan: '#06b6d4',
        }
      }
    },
  },
  plugins: [],
}
