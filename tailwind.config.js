/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: Object.fromEntries([
        'canvas', 'surface', 'surface-muted', 'surface-hover', 'ink', 'secondary',
        'muted', 'line', 'line-strong', 'accent', 'accent-hover', 'accent-soft',
        'accent-ink', 'on-accent', 'danger', 'danger-soft', 'warning',
        'warning-soft', 'warning-line',
      ].map(name => [name, `rgb(var(--${name}) / <alpha-value>)`])),
    },
  },
  plugins: [],
}
