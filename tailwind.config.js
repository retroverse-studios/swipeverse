/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './constants.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  // Reality `colors` are Tailwind class strings that also arrive at runtime
  // (store catalog, imports, play links), so the palette patterns realities
  // use must survive purging even when unseen in source.
  safelist: [
    {
      pattern:
        /^(text|bg|border|from|via|to)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}$/,
    },
    {
      pattern:
        /^(text|bg|border)-(cyber-pink|cyber-cyan|mystic-purple|mystic-gold|space-blue|space-silver|tarot-gold|tarot-gold-bright|tarot-paper|tarot-muted|tarot-velvet|tarot-velvet-2)$/,
    },
    { pattern: /^bg-gradient-to-(t|tr|r|br|b|bl|l|tl)$/ },
  ],
  theme: {
    extend: {
      colors: {
        'cyber-pink': '#ff52e1',
        'cyber-cyan': '#00f2ff',
        'mystic-purple': '#a45cff',
        'mystic-gold': '#ffc857',
        'space-blue': '#4d9eff',
        'space-silver': '#c0c0c0',
        'tarot-gold': '#c9962e',
        'tarot-gold-bright': '#f6e4a8',
        'tarot-paper': '#e9dfc8',
        'tarot-muted': '#9a8db4',
        'tarot-velvet': '#0d0718',
        'tarot-velvet-2': '#120a22',
      },
      animation: {
        'fade-in': 'fade-in 0.75s ease-out forwards',
        'pulse-fast': 'pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(-10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-fast': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '.8', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
};
