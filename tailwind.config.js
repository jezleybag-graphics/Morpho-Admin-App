/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#013E37',    // Deep Green
          light: '#F4F3F2',   // Soft Cream
          accent: '#C8A165',  // Gold (Optional Accent)
          surface: '#FFFFFF', // Pure White for Cards
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(1, 62, 55, 0.05)',
        'glass': '0 8px 32px 0 rgba(1, 62, 55, 0.1)',
      }
    },
  },
  plugins: [],
}