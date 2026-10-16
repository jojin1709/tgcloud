/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          blue: {
            DEFAULT: '#2481cc',
            50: '#f0f7fe',
            100: '#ddedfc',
            200: '#c3e0fa',
            300: '#9bcbf6',
            400: '#6caef0',
            500: '#2481cc',
            600: '#1b6cb2',
            700: '#17568f',
            800: '#174976',
            900: '#183e63',
          },
          dark: {
            bg: 'var(--tg-bg)',
            surface: 'var(--tg-surface)',
            surfaceHover: 'var(--tg-surface-hover)',
            border: 'var(--tg-border)',
            input: 'var(--tg-input)',
            text: 'var(--tg-text)',
            muted: 'var(--tg-muted)',
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
