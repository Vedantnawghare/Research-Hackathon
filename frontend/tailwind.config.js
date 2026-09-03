/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#334e68',
          700: '#102a43',
          800: '#0b1b2b',
          900: '#06101e',
        },
        clinical: {
          teal: '#0e7490',
          blue: '#2563eb',
          emerald: '#10b981',
          amber: '#f59e0b',
          orange: '#f97316',
          rose: '#e11d48'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
