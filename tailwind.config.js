/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        smaragd: { DEFAULT: '#1B5E20', light: '#4CAF50', dark: '#0E3811' },
        dream: { purple: '#4A148C' },
        nightmare: '#1A1A2E',
        dawn: '#F5F5DC',
        gold: '#FFC107',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
