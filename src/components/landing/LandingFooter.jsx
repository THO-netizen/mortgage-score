// ── Landing Footer — minimal, private-banking tone ─────────────

export default function LandingFooter({ onStart }) { // eslint-disable-line no-unused-vars
  return (
    <footer className="bg-dark-900 py-8 sm:py-10 px-5 sm:px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto text-center space-y-5">

        {/* Privacy note */}
        <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: '#6B7A8D' }}>
          Your data is processed locally and never shared without your consent.
        </p>

        {/* Calendly link */}
        <a
          href="https://calendly.com/andy-lkadvisor/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-[44px] px-3 py-2 text-[13px] sm:text-sm transition-colors"
          style={{ color: '#C9A96E' }}
        >
          Book a direct conversation with Andy Le
        </a>

        {/* Divider */}
        <div className="h-px w-12 mx-auto" style={{ backgroundColor: 'rgba(107,122,141,0.25)' }} />

        {/* Copyright */}
        <p className="text-[11px] sm:text-xs" style={{ color: '#475569' }}>
          Mortgage Score &mdash; Czech Republic
        </p>

      </div>
    </footer>
  )
}
