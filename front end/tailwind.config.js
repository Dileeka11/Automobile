/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary accent — Royal Blue (#4169E1)
        brand: {
          50: '#eef3fd',
          100: '#dbe6fb',
          200: '#bccff7',
          300: '#93b0f0',
          400: '#6389e8',
          500: '#4169E1',
          600: '#3457c5',
          700: '#2c47a0',
          800: '#283e80',
          900: '#243866',
        },
        // Secondary accent — Blue Gray (#98AFC7)
        bluegray: {
          50: '#f4f6f9',
          100: '#e7ecf2',
          200: '#cfd9e5',
          300: '#b3c2d4',
          400: '#98AFC7',
          500: '#7e97b3',
          600: '#647c98',
          700: '#516379',
          800: '#3e4c5e',
          900: '#2c3643',
        },
        // Metallic silver / light gray base
        silver: {
          50: '#fafbfc',
          100: '#f1f4f8',
          200: '#e3e9f0',
          300: '#cdd6e1',
        },
        // Deep royal navy (anchors)
        navy: {
          800: '#233c85',
          900: '#1f3470',
          950: '#16264f',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(65, 105, 225, 0.12)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #4169E1 0%, #3457c5 50%, #98AFC7 100%)',
      },
    },
  },
  plugins: [],
};
