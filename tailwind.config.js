/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./constants.ts",
    "./types.ts",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./screens/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-main)',
          light: 'var(--brand-light)',
          dark: 'var(--brand-dark)',
          text: 'var(--brand-text)'
        },
        cream: '#F8F4F0',
        navy: {
          DEFAULT: '#1A1B2E',
          surface: '#2D2D44',
          border: '#404058'
        },
        peach: {
          50: '#FFF5F5',
          100: '#FFE6E6',
          200: '#FFB3B3',
          300: '#FF9999',
          400: '#FF8080',
          500: '#FF6B6B',
          600: '#E64A4A',
        },
        sage: {
          DEFAULT: '#A8D5BA',
          light: '#C8E5D1',
          dark: '#88B59A'
        },
        lavender: {
          DEFAULT: '#C7A3D8',
          light: '#E0B8E5',
          dark: '#A682B8'
        },
        warmGray: {
          DEFAULT: '#4A4A4A',
          medium: '#757575',
          light: '#E0E0E0',
          dark: '#333333'
        },
        nearWhite: '#F5F5F5',
        "watercolor-mint": "var(--watercolor-mint)",
        "watercolor-sun": "var(--watercolor-sun)",
        "watercolor-rose": "var(--watercolor-rose)",
        "soft-teal": "var(--soft-teal)",
        "soft-amber": "var(--soft-amber)",
        "soft-coral": "var(--soft-coral)",
        "soft-orange": "#FBA988",
        "soft-mint": "#95D5B2",
      },
      fontFamily: {
        sans: ['Quicksand', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Lexend', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: [],
};
