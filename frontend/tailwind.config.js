/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        s: {
          bg:       '#0a0a0f',
          surface:  '#111118',
          card:     '#18181f',
          border:   '#252530',
          // Vibrant accents
          violet:   '#7c3aed',
          'violet-light': '#a78bfa',
          pink:     '#ec4899',
          cyan:     '#06b6d4',
          emerald:  '#10b981',
          amber:    '#f59e0b',
          // Text
          text:     '#f0f0f8',
          dim:      '#8888a8',
          muted:    '#55556a',
        }
      },
      fontFamily: {
        display: ['"Clash Display"', '"Cabinet Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Cabinet Grotesk"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grad-violet': 'linear-gradient(135deg, #7c3aed, #ec4899)',
        'grad-cyan':   'linear-gradient(135deg, #06b6d4, #10b981)',
        'grad-warm':   'linear-gradient(135deg, #f59e0b, #ec4899)',
        'grad-cool':   'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'slide-up':   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'fade-in':    { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in':   { from: { opacity: 0, transform: 'scale(0.9)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'float-up':   { '0%': { opacity: 1, transform: 'translateY(0) scale(1)' }, '100%': { opacity: 0, transform: 'translateY(-80px) scale(1.5)' } },
        'pulse-ring': { '0%,100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(124,58,237,0)' } },
        'shimmer':    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'slide-up':   'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fade-in 0.4s ease forwards',
        'scale-in':   'scale-in 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'float-up':   'float-up 1.8s ease-out forwards',
        'pulse-ring': 'pulse-ring 1.5s ease infinite',
        'shimmer':    'shimmer 2s linear infinite',
      }
    }
  },
  plugins: []
}