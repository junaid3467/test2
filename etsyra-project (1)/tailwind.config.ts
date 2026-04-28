/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        accent: '#4f46e5',
        'accent-h': '#3730a3',
      },
      backdropBlur: { glass: '24px' },
      borderRadius: {
        card: '16px',
        xl2: '20px',
        xl3: '24px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04)',
        modal: '0 24px 64px rgba(0,0,0,0.12),0 8px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
