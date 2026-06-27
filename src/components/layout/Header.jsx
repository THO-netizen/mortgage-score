import { Shield, Lock } from 'lucide-react'

/**
 * Sticky glassmorphism header.
 * Shows progress bar only during the 7-step funnel (steps 1–7).
 */
export default function Header({ currentStep, totalSteps = 7 }) {
  const isFunnel   = currentStep >= 1 && currentStep <= totalSteps
  const progressPct = isFunnel ? Math.round((currentStep / totalSteps) * 100) : 0

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">

        {/* ── Logo ─────────────────────────────────────── */}
        <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          {/* Icon mark */}
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
            <svg
              width="16" height="16" viewBox="0 0 16 16"
              fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1"  y="9"  width="3" height="6" rx="1" fill="white" fillOpacity=".7" />
              <rect x="6"  y="5"  width="3" height="10" rx="1" fill="white" fillOpacity=".9" />
              <rect x="11" y="1"  width="3" height="14" rx="1" fill="white" />
            </svg>
          </div>
          {/* Wordmark */}
          <span className="font-display font-extrabold text-ink tracking-tight leading-none">
            MORTGAGE{' '}
            <span className="text-brand-600">SCORE</span>
            <sup className="text-[9px] font-normal tracking-normal align-super ml-px">™</sup>
          </span>
        </a>

        {/* ── Funnel progress (desktop) ─────────────────── */}
        {isFunnel && (
          <div className="hidden sm:flex flex-1 max-w-xs items-center gap-3 mx-auto">
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-label text-ink-muted whitespace-nowrap tabular-nums">
              {currentStep} / {totalSteps}
            </span>
          </div>
        )}

        {/* ── Badges ───────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 rounded-full bg-success-light border border-success-border px-3 py-1">
            <Lock size={11} className="text-success-text" />
            <span className="text-[11px] font-semibold text-success-text hidden xs:inline">
              100% Private
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1">
            <Shield size={11} className="text-brand-600" />
            <span className="text-[11px] font-semibold text-ink-muted">No credit check</span>
          </div>
        </div>
      </div>

      {/* Mobile progress bar — full-width strip under the header */}
      {isFunnel && (
        <div className="sm:hidden h-0.5 bg-border">
          <div
            className="h-full bg-brand-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </header>
  )
}
