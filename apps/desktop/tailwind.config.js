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
            bg: '#0f141c',
            surface: '#171e28',
            surfaceHover: '#1f2937',
            border: '#263345',
            input: '#111722',
            text: '#f3f4f6',
            muted: '#94a3b8',
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
