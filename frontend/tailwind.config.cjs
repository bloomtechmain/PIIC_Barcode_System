/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eef0f9',
          100: '#d5d8f0',
          200: '#adb1e1',
          300: '#7e84d2',
          400: '#4d55be',
          500: '#2a2480',
          600: '#1b1464',   // ← brand primary
          700: '#151050',
          800: '#0e0b3b',
          900: '#080625',
        },
        magenta: {
          50:  '#fdeef4',
          100: '#fad4e5',
          200: '#f4a8cb',
          300: '#eb73aa',
          400: '#d03a7a',
          500: '#a51655',   // ← brand accent
          600: '#8a1248',
          700: '#6f0e3a',
          800: '#540a2c',
          900: '#3a071e',
        }
      }
    }
  },
  plugins: []
}
