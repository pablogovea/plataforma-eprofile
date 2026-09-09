/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { ink: '#0f172a', brand: '#2563eb' }, boxShadow: { soft: '0 18px 50px -24px rgba(15,23,42,.3)' } } },
  plugins: []
};
