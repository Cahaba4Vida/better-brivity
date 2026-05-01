/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b5bdb',
          600: '#2f4ac0',
          700: '#2340a8',
          900: '#0f1e5a',
        },
        surface: '#0d0f14',
        'surface-2': '#13161e',
        'surface-3': '#1a1e28',
        'border': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      }
    }
  },
  plugins: []
}
