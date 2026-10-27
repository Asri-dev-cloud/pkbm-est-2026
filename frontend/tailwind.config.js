/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5CB8FF', // Sky Blue
          dark: '#3A9BF0',
          light: '#EBF6FF',
        },
        orange: {
          DEFAULT: '#FFaf5c', // Warm Orange
          dark: '#E59235',
          light: '#FFF4E8',
        },
        green: {
          DEFAULT: '#6BCB77', // Fresh Green
          dark: '#4FA85B',
          light: '#E6F8EA',
        },
        yellow: {
          DEFAULT: '#F9C846', // Yellow
          dark: '#DDAE2B',
          light: '#FEF8E7',
        },
        cream: {
          DEFAULT: '#FFF8EE', // Soft Cream
          dark: '#F5E9D8',
        },
        navy: {
          DEFAULT: '#243B53', // Dark Navy text
          dark: '#182838',
          light: '#334E68',
        },
        brand: {
          sky: '#5CB8FF',
          'sky-dark': '#3A9BF0',
          'sky-light': '#EBF6FF',
          orange: '#FFaf5c',
          'orange-dark': '#E59235',
          'orange-light': '#FFF4E8',
          green: '#6BCB77',
          'green-light': '#E6F8EA',
          yellow: '#F9C846',
          'yellow-light': '#FEF8E7',
          cream: '#FFF8EE',
          navy: '#243B53',
          'navy-dark': '#182838',
        },
        accent: {
          DEFAULT: '#FFaf5c', // Warm Orange
          dark: '#E59235',
          light: '#FFF4E8',
        },
        siswa: '#5CB8FF',
        tutor: '#FFaf5c',
        admin: '#243B53',
        pimpinan: '#F9C846',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
