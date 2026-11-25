/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#faf8f9',
        ink: '#121214',
        accent: '#e8276b',
        accentHover: '#c71957',
        deep: '#a50f45',
        palePink: '#ffeef4',
        card: '#ffffff',
        borderPink: 'rgba(232, 39, 107, 0.25)',
        borderLight: 'rgba(18, 18, 20, 0.08)',
        primary: {
          DEFAULT: '#e8276b',
          hover: '#a50f45',
          pale: '#ffeef4',
        },
        accent2: '#ff9d5c',
        accentLt: '#ff4d89',
        tint: '#fdf1e8',
        tint2: '#ffeef4',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'serif'],
        display: ['var(--font-display)', 'Manrope', 'sans-serif'],
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
