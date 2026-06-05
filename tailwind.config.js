/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 🌟 ADICIONE ESTA LINHA AQUI:
  darkMode: ['selector', '[data-theme="dark"]'], 
  theme: {
    extend: {},
  },
  plugins: [],
}