/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5CB8FF',
          dark: '#3a9ce8',
          light: '#e3f2fd',
        },
        accent: {
          DEFAULT: '#FFaf5c',
          dark: '#e89a47',
        },
        siswa: '#5CB8FF',
        tutor: '#6BCB77',
        admin: '#FFaf5c',
        pimpinan: '#F9C846',
      },
      fontFamily: {
        sans: ['"Source Sans Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
