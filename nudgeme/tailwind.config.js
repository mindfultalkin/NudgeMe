/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c9a84c',
          dark: '#1a1a18',
          light: '#f7f4ef',
        },
        success: '#4a9a6a',
        warning: '#e05a2b',
        muted: '#888',
        border: '#e0dcd4',
        surface: {
          light: '#f7f4ef',
          dark: '#0a0a0a',
          card: '#141414',
          cardBorder: '#202020',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      fontSize: {
        'xs': '0.6rem',
        'sm': '0.72rem',
        'base': '0.85rem',
        'lg': '0.95rem',
        'xl': '1.05rem',
        '2xl': '1.4rem',
        '3xl': '2.2rem',
        '4xl': '3.5rem',
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '0.1em',
        'normal': '0.12em',
        'wide': '0.2em',
        'widest': '0.25em',
      },
    },
  },
  plugins: [],
}

