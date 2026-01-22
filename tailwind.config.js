/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2481cc',
        'primary-blue-dark': '#1d6ba8',
        'primary-blue-light': '#4299e1',
      },
    },
  },
  plugins: [],
}
