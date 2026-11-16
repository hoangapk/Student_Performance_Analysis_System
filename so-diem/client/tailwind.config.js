/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16233B',
        paper: '#F3F7FB',
        rule: '#D3DEEA',
        pine: '#0E6F7E',
        marker: '#FFD84D',
        danger: '#B3261E',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
