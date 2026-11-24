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
        hub: {
          bg: '#F5F6FA',
          'bg-dark': '#0F111A',
          card: '#FFFFFF',
          'card-dark': '#181A26',
          'card-subtle-dark': '#212435',
          text: '#202435',
          'text-dark': '#F0F2F9',
          muted: '#858B9B',
          'muted-dark': '#9CA3AF',
          primary: '#7167E8',
          secondary: '#8E83F5',
          border: '#E9EAF0',
          'border-dark': '#2A2D40',
          positive: '#22A879',
          negative: '#E56B73',
          info: '#5599E8',
          warning: '#F59E0B',
        },
        module: {
          brainvault: '#8E83F5',
          spendwise: '#7167E8',
          tasks: '#0D9488',
          study: '#3B82F6',
          goals: '#22A879',
          wishlist: '#EC4899',
          calendar: '#F97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'hub': '18px',
        'hub-sm': '12px',
        'hub-lg': '24px',
      },
      boxShadow: {
        'hub-sm': '0 2px 8px 0 rgba(32, 36, 53, 0.04)',
        'hub': '0 4px 20px -2px rgba(32, 36, 53, 0.06)',
        'hub-lg': '0 10px 30px -4px rgba(32, 36, 53, 0.08)',
        'hub-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
