/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'josefin-sans': ['var(--font-josefin-sans)', 'sans-serif'],
        'noto-serif': ['var(--font-noto-serif)', 'Times New Roman', 'Times', 'serif'],
        'times': ['"Times New Roman"', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
}; 