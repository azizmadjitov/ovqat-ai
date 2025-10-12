/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-fill)',
        'label-primary': 'var(--label-primary)',
        'label-secondary': 'var(--label-secondary)',
        'label-tertiary': 'var(--label-secondary)',
        'label-on-accent': 'var(--static-white)',
        'accent-green': 'var(--colors-green)',
        'accent-protein': 'var(--colors-violet)',
        'accent-carbs': 'var(--colors-orange)',
        'accent-fat': 'var(--colors-blue)',
        'accent-error': 'var(--colors-red)',
        'overlay-dark': 'rgba(0,0,0,0.4)',
      },
      boxShadow: {
        '1': '0 4px 12px rgba(0,0,0,0.08)',
        'focus-ring': '0 0 0 4px var(--colors-green-50)',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}