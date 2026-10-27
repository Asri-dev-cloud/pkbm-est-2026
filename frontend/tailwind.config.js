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
          DEFAULT: '#059669', // Emerald 600
          dark: '#047857',    // Emerald 700
          light: '#ECFDF5',   // Emerald 50
        },
        brand: {
          green: '#059669',
          'green-dark': '#047857',
          'green-deep': '#064E3B',
          'green-light': '#ECFDF5',
          'green-border': '#A7F3D0',
          mint: '#10B981',
          'mint-light': '#F0FDF4',
          'mint-border': '#BBF7D0',
          yellow: '#FBBF24',
          'yellow-dark': '#F59E0B',
          'yellow-light': '#FEF9C3',
          'yellow-border': '#FEF08A',
          dark: '#021B14',
          'dark-surface': '#06281E',
          'dark-card': '#0A3F31',
          'dark-border': '#114B3B',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        siswa: '#059669',
        tutor: '#10B981',
        admin: '#059669',
        pimpinan: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
