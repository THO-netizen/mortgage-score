/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      // ── Typography ────────────────────────────────────────
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
      },

      // ── Design-token colours ──────────────────────────────
      // Mirrors the spec exactly; kept as semantic names so
      // component authors never hardcode hex values.
      colors: {
        // Surfaces
        surface:  '#F8FAFC',   // page background
        card:     '#FFFFFF',   // card surface

        // Text
        ink: {
          DEFAULT: '#0F172A',  // primary text  (Slate 900)
          muted:   '#64748B',  // secondary text (Slate 600)
          subtle:  '#94A3B8',  // tertiary text  (Slate 400)
        },

        // UI chrome
        border: {
          DEFAULT: '#E2E8F0',  // default border (Slate 200)
          strong:  '#CBD5E1',  // hovered/focused border
        },

        // Dark surfaces (hero, score cards, sidebar)
        dark: {
          900: '#0F172A',      // Slate 900
          800: '#1E293B',      // Slate 800
          700: '#334155',      // Slate 700
        },

        // Brand / accent
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',      // Blue 500
          600: '#2563EB',      // Blue 600  ← primary CTA
          700: '#1D4ED8',      // Blue 700
          800: '#1E40AF',      // Blue 800
          900: '#1E3A8A',      // Blue 900  ← hero gradient end
        },

        // Semantic status
        success: {
          DEFAULT: '#10B981',  // Emerald 500
          light:   '#ECFDF5',
          border:  '#A7F3D0',
          text:    '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',  // Amber 500
          light:   '#FFFBEB',
          border:  '#FCD34D',
          text:    '#92400E',
        },
        risk: {
          DEFAULT: '#EF4444',  // Red 500
          light:   '#FEF2F2',
          border:  '#FECACA',
          text:    '#991B1B',
        },
        neutral: {
          light:  '#F1F5F9',
          border: '#CBD5E1',
          text:   '#475569',
        },
      },

      // ── Background gradients ──────────────────────────────
      backgroundImage: {
        hero:      'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        'card-dark': 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
        'brand-soft': 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      },

      // ── Spacing / sizing ──────────────────────────────────
      height: {
        'input': '56px',     // spec: all inputs 56 px tall
      },
      minHeight: {
        'input': '56px',
      },

      // ── Border radius ─────────────────────────────────────
      borderRadius: {
        'card':  '1.5rem',   // 24 px — funnel cards (rounded-3xl)
        'input': '0.75rem',  // 12 px — inputs & selects
        'badge': '0.375rem', // 6 px  — status badges
      },

      // ── Shadows ───────────────────────────────────────────
      boxShadow: {
        'card':        '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'card-md':     '0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04)',
        'card-lg':     '0 8px 30px rgba(0,0,0,.10), 0 4px 10px rgba(0,0,0,.06)',
        'input-focus': '0 0 0 3px rgba(37,99,235,.12)',
        'cta':         '0 4px 12px rgba(37,99,235,.30)',
        'cta-hover':   '0 8px 24px rgba(37,99,235,.40)',
        'hero-card':   '0 24px 60px rgba(0,0,0,.35)',
        'gauge-glow':  '0 0 40px rgba(59,130,246,.35)',
      },

      // ── Typography scale matching spec ─────────────────────
      fontSize: {
        // H1 → 48 px / bold / tight spacing
        'display': ['3rem', { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '800' }],
        // H2 → 28 px / semibold
        'h2':      ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
        // Body → 16 px
        'body':    ['1rem', { lineHeight: '1.6' }],
        // Labels → 12 px / uppercase / tracking-wide
        'label':   ['0.75rem', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '500' }],
      },

      // ── Animations ────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-right': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        'gauge-fill': {
          '0%':   { strokeDashoffset: '377' },
          '100%': { strokeDashoffset: '83'  },   // 78 % filled
        },
        'ping-soft': {
          '0%,100%': { transform: 'scale(1)', opacity: '1'   },
          '50%':     { transform: 'scale(1.08)', opacity: '.7' },
        },
        'scan': {
          '0%':   { top: '0%',   opacity: '0' },
          '10%':  {              opacity: '1' },
          '90%':  {              opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
      animation: {
        'fade-up':    'fade-up   .45s ease both',
        'fade-in':    'fade-in   .3s  ease both',
        'slide-right':'slide-right .35s ease both',
        'slide-left': 'slide-left  .35s ease both',
        'shimmer':    'shimmer 2s linear infinite',
        'gauge-fill': 'gauge-fill 2.4s cubic-bezier(.4,0,.2,1) .8s both',
        'ping-soft':  'ping-soft 2s ease-in-out infinite',
        'scan':       'scan 2s ease-in-out infinite',
      },
    },
  },

  plugins: [],
}
