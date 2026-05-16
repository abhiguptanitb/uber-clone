/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gonexi: {
          primary: '#0f766e',
          secondary: '#2563eb',
          accent: '#f97316',
          light: '#f8fafc',
          dark: '#172033',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444',
          neutral: '#64748b',
          gradient: {
            from: '#0f766e',
            to: '#2563eb'
          }
        }
      },
      fontFamily: {
        'gonexi': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gonexi': '0 12px 30px -18px rgba(15, 118, 110, 0.55)',
        'gonexi-lg': '0 24px 60px -32px rgba(23, 32, 51, 0.36)',
      },
      backgroundImage: {
        'gonexi-gradient': 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
        'gonexi-gradient-light': 'linear-gradient(135deg, #ecfeff 0%, #f8fafc 55%, #fff7ed 100%)',
      }
    },
  },
  plugins: [],
}

