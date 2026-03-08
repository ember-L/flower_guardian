/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e94b52',
        secondary: '#5aaf6a',
        accent: '#f5d78e',
        background: '#faf8f5',
        surface: '#ffffff',
        text: '#333333',
        'text-secondary': '#666666',
        'text-light': '#999999',
      },
    },
  },
  plugins: [],
};
